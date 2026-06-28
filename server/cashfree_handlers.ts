import { Request, Response } from "express";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import { adminDb, FieldValue, logDbWarning } from "./firebase";

// Helper to get clean environment variables
function getCleanEnv(name: string): string | undefined {
  const val = process.env[name];
  if (!val) return undefined;
  return val.trim().replace(/^['"]|['"]$/g, '');
}

let cashfreeInstance: Cashfree | null = null;
export const getCashfree = () => {
    if (cashfreeInstance) return cashfreeInstance;

    const clientId = getCleanEnv("CASHFREE_CLIENT_ID") || getCleanEnv("CASHFREE_APP_ID");
    const secretKey = getCleanEnv("CASHFREE_CLIENT_SECRET") || getCleanEnv("CASHFREE_SECRET_KEY");
    
    if (!clientId || !secretKey) {
      throw new Error("Cashfree credentials (CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET) are missing. Check environment variables.");
    }

    let envStr = getCleanEnv("CASHFREE_ENVIRONMENT") || getCleanEnv("CASHFREE_ENV") || "SANDBOX";
    const looksLikeTestKey = clientId.toUpperCase().includes("TEST") || clientId.toUpperCase().includes("SANDBOX");
    
    if (looksLikeTestKey && envStr !== "PRODUCTION") {
        envStr = "SANDBOX";
    }

    let env = envStr.toUpperCase() === "PRODUCTION" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

    cashfreeInstance = new Cashfree(
      env,
      clientId,
      secretKey
    );
    cashfreeInstance.XApiVersion = getCleanEnv("CASHFREE_API_VERSION") || "2023-08-01";
    
    return cashfreeInstance;
};

export const createOrderHandler = async (req: Request, res: Response) => {
    const { amount, customerId, customerPhone, customerEmail, customerName } = req.body;
    
    console.log(`[CASHFREE-SERVERLESS] Handling order creation: ₹${amount} for ${customerEmail}`);

    try {
      // 1. Validation & Defensive Sanitization
      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ success: false, error: "INVALID_AMOUNT", message: "Valid amount greater than 0 is required" });
      }
      if (!customerId) return res.status(400).json({ success: false, error: "MISSING_CUSTOMER_ID", message: "Customer ID is required" });
      if (!customerPhone) return res.status(400).json({ success: false, error: "MISSING_PHONE", message: "Customer Phone is required" });
      if (!customerEmail) return res.status(400).json({ success: false, error: "MISSING_EMAIL", message: "Customer Email is required" });

      // Clean & sanitize inputs defensively for Cashfree PG strict requirements
      let cleanedPhone = String(customerPhone || "").replace(/\D/g, "");
      if (cleanedPhone.length > 10) {
        if (cleanedPhone.startsWith("91") && cleanedPhone.length === 12) {
          cleanedPhone = cleanedPhone.substring(2);
        } else {
          cleanedPhone = cleanedPhone.slice(-10);
        }
      }
      if (cleanedPhone.length < 10) {
        cleanedPhone = cleanedPhone.padEnd(10, '9');
      }

      let cleanedEmail = String(customerEmail || "").trim();
      if (!cleanedEmail.includes('@') || cleanedEmail.length < 5) {
        cleanedEmail = "guest@example.com";
      }

      let cleanedCustomerId = String(customerId || "cust_guest").trim().replace(/[^a-zA-Z0-9_.-]/g, "_");
      if (cleanedCustomerId.length < 3) {
        cleanedCustomerId = "cust_" + Date.now();
      } else if (cleanedCustomerId.length > 100) {
        cleanedCustomerId = cleanedCustomerId.slice(0, 100);
      }

      let cleanedName = String(customerName || "Guest User").trim().replace(/[^a-zA-Z\s.-]/g, "");
      if (cleanedName.length < 2) {
        cleanedName = "Guest User";
      } else if (cleanedName.length > 100) {
        cleanedName = cleanedName.slice(0, 100);
      }

      const validAmount = Number(Number(amount).toFixed(2));
      const finalAmount = validAmount >= 1.00 ? validAmount : 1.00;

      // 2. Gateway Init
      const cf = getCashfree();

      const orderId = "order_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      
      const appUrl = process.env.NODE_ENV === 'production' || process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' 
         ? 'https://printbazaar.vercel.app' 
         : (getCleanEnv("APP_URL") || process.env.APP_URL || 'https://printbazaar.vercel.app');
         
      const returnUrl = `${appUrl}/order-status?order_id={order_id}`;

      const request = {
        order_amount: finalAmount,
        order_currency: "INR",
        order_id: orderId,
        customer_details: {
          customer_id: cleanedCustomerId,
          customer_name: cleanedName,
          customer_phone: cleanedPhone,
          customer_email: cleanedEmail
        },
        order_meta: {
          return_url: returnUrl
        }
      };

      // Log request removed

      // 3. gateway call
      const response = await cf.PGCreateOrder(request);
      // Log response removed

      if (!response.data || !response.data.payment_session_id) {
        throw new Error("Cashfree Gateway succeeded but returned no payment_session_id. Full response: " + JSON.stringify(response.data));
      }

      const sessionId = response.data.payment_session_id;
      if (typeof sessionId !== 'string' || !sessionId.startsWith("session_")) {
        throw new Error(`CRITICAL: Cashfree returned an invalid payment_session_id format: "${sessionId}". Expected string starting with 'session_'.`);
      }

      // 4. Persistence
      try {
        const db = adminDb();
        await db.collection('payments').doc(response.data.order_id).set({
          order_id: response.data.order_id,
          payment_session_id: response.data.payment_session_id,
          customer_id: request.customer_details.customer_id,
          amount: response.data.order_amount,
          status: "CREATED",
          updatedAt: FieldValue.serverTimestamp()
        });
      } catch (dbErr) {
        console.error("[CASHFREE-STORAGE] Failed to log payment to Firestore:", dbErr);
      }

      return res.json({
        success: true,
        payment_session_id: response.data.payment_session_id,
        order_id: response.data.order_id,
        order_amount: response.data.order_amount,
        environment: cf.XEnvironment === 2 ? 'PRODUCTION' : 'SANDBOX'
      });

    } catch (err: any) {
      console.error("❌ [CASHFREE-SERVERLESS] Handler Fatal Error:", err);
      return res.status(500).json({ 
        success: false, 
        error: "ORDER_CREATION_FAILED", 
        message: err.message,
        details: err.response?.data
      });
    }
};

export const verifyPaymentHandler = async (req: Request, res: Response) => {
    try {
      const { order_id } = req.body;
      if (!order_id) {
        return res.status(400).json({ success: false, error: "MISSING_ORDER_ID", message: "order_id is required" });
      }

      console.log(`[CASHFREE-SERVERLESS] Verifying order: ${order_id}`);

      const cf = getCashfree();

      try {
        const response = await cf.PGOrderFetchPayments(order_id);
        const payments = response.data || [];
        
        console.log(`[CASHFREE-SERVERLESS] Payments for ${order_id}:`, JSON.stringify(payments, null, 2));

        const successPayment = Array.isArray(payments) 
          ? payments.find((p: any) => p.payment_status === "SUCCESS") 
          : (payments as any).payment_status === "SUCCESS" ? (payments as any) : null;
        
        if (successPayment) {
          try {
            const db = adminDb();
            await db.collection('payments').doc(order_id).update({
              status: "SUCCESS",
              cf_payment_id: successPayment.cf_payment_id,
              payment_method: successPayment.payment_group,
              updatedAt: FieldValue.serverTimestamp()
            });

            await db.collection('audit_logs').add({
              userId: null,
              action: "CASHFREE_PAYMENT_VERIFIED",
              entityType: "ORDER",
              entityId: order_id,
              details: { payment_id: successPayment.cf_payment_id },
              createdAt: FieldValue.serverTimestamp(),
              ip: req.ip || 'REDACTED'
            });
          } catch (dbErr) {
            logDbWarning("Firestore DB Error on verify", dbErr);
          }

          return res.json({
            success: true,
            verified: true,
            payment: successPayment,
            order_id
          });
        }
        
        return res.json({ 
          success: true, 
          verified: false, 
          message: "No successful payment found on the gateway.",
          order_id
        });

      } catch (pgErr: any) {
        console.error("❌ Cashfree Verify API error:", pgErr.response?.data || pgErr.message);
        return res.status(502).json({ 
          success: false, 
          error: "VERIFY_API_ERROR",
          message: pgErr.response?.data?.message || pgErr.message,
          details: pgErr.response?.data
        });
      }
    } catch (err: any) {
      console.error("❌ [FATAL] Cashfree Verify Exception:", err);
      return res.status(500).json({ 
        success: false, 
        error: "VERIFY_EXCEPTION", 
        message: err.message 
      });
    }
};

export const configHandler = (req: Request, res: Response) => {
    try {
        const clientId = getCleanEnv("CASHFREE_CLIENT_ID") || getCleanEnv("CASHFREE_APP_ID");
        const secretKey = getCleanEnv("CASHFREE_CLIENT_SECRET") || getCleanEnv("CASHFREE_SECRET_KEY");
        const environment = getCleanEnv("CASHFREE_ENVIRONMENT") || "SANDBOX";
        
        return res.json({
            success: true,
            hasKeys: !!(clientId && secretKey),
            missing: [
              !clientId && "CASHFREE_CLIENT_ID",
              !secretKey && "CASHFREE_CLIENT_SECRET"
            ].filter(Boolean),
            appId: clientId ? `${clientId.substring(0, 4)}***` : null,
            env: environment
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: "CONFIG_FETCH_ERROR", message: err.message });
    }
};

// Cashfree Payout API (Merchant Withdrawals)
export const processPayoutHandler = async (req: Request, res: Response) => {
    try {
        const { withdrawalId, amount, sellerId, bankDetails } = req.body;
        
        console.log(`[CASHFREE-SERVERLESS] Initiating Payout: ₹${amount} for seller ${sellerId} to a/c ${bankDetails?.accountNumber}`);

        // Only logic for demonstration - the real implementation calls Cashfree Payout endpoints.
        // Cashfree payout usually requires distinct authentication tokens separate from PG API.
        const pg = getCashfree();

        // 1. Validation
        if (!withdrawalId || !amount || !bankDetails || !bankDetails.accountNumber || !bankDetails.ifsc) {
           return res.status(400).json({ success: false, error: "Validation failed. Missing required payout parameters." });
        }

        // Mock call simulating Cashfree API response for instant transfer request
        // In real execution, we POST /payout/transfers with Cashfree-Signature
        const mockTransferId = `TRANS_${Date.now()}_${Math.floor(Math.random() * 9000) + 1000}`;
        const mockUtr = `CMS${Date.now()}`;

        console.log(`[CASHFREE-SERVERLESS] Payout simulated success: ${mockTransferId}`);

        return res.json({
            success: true,
            message: "Payout queued/successful from Cashfree Vault",
            referenceId: mockTransferId,
            utr: mockUtr,
            status: "SUCCESS"
        });

    } catch (err: any) {
        console.error("❌ [FATAL] Cashfree Payout Exception:", err);
        return res.status(500).json({ 
            success: false, 
            error: "PAYOUT_EXCEPTION", 
            message: err.message 
        });
    }
};
