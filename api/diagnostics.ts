import { CFEnvironment } from "cashfree-pg";

export function maskKey(key: string | undefined): string {
    if (!key) return "MISSING";
    return key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : "****";
}

export function logCashfreeDiagnostics() {
    console.log("========== CASHFREE SERVERLESS DIAGNOSTICS ==========");
    console.log(`TIME: ${new Date().toISOString()}`);
    console.log(`CASHFREE_CLIENT_ID: ${maskKey(process.env.CASHFREE_CLIENT_ID || process.env.CASHFREE_APP_ID)}`);
    console.log(`CASHFREE_CLIENT_SECRET: ${process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_SECRET_KEY ? "LOADED" : "MISSING"}`);
    console.log(`CASHFREE_ENVIRONMENT: ${process.env.CASHFREE_ENVIRONMENT || "NOT_SET (Defaulting to SANDBOX)"}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`VERCEL: ${process.env.VERCEL || "false"}`);
    console.log("====================================================");
}

export function validateEnvironment() {
    const clientId = process.env.CASHFREE_CLIENT_ID || process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_SECRET_KEY;
    const env = process.env.CASHFREE_ENVIRONMENT;

    const missing = [];
    if (!clientId) missing.push("CASHFREE_CLIENT_ID");
    if (!secretKey) missing.push("CASHFREE_CLIENT_SECRET");
    if (!env) missing.push("CASHFREE_ENVIRONMENT");

    if (missing.length > 0) {
        throw new Error(`Missing required Cashfree environment variables: ${missing.join(", ")}`);
    }
}

export function logOrderRequest(request: any) {
    console.log("🚀 [CASHFREE] OUTGOING REQUEST BODY:", JSON.stringify(request, null, 2));
}

export function logOrderResponse(response: any) {
    console.log("✅ [CASHFREE] INCOMING RESPONSE DATA:", JSON.stringify(response.data || response, null, 2));
    
    if (!response.data?.payment_session_id) {
        console.error("❌ [CASHFREE] MISSING payment_session_id in response!");
    } else {
        console.log(`✅ [CASHFREE] VALIDATED payment_session_id: ${response.data.payment_session_id.substring(0, 15)}...`);
    }
}
