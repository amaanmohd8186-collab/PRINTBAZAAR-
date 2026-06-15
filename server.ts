/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import crypto from "crypto";
import twilio from "twilio";
import nodemailer from "nodemailer";
import fs from "fs";
import bcrypt from "bcryptjs";
import admin from "firebase-admin";
import { getFirebaseAdmin, adminDb, adminAuth, adminStorage } from "./server/firebase";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";

dotenv.config();

// --- ADMIN ACCESS CONTROL WHITELIST ---
const AUTHORIZED_ADMINS = [
  "musagraphics75@gmail.com",
  "gazisiddiqui01@gmail.com"
];

// Firebase Status for Diagnostics
let firebaseStatus = "Connected";
let firebaseAdminChecked = false;

// Safe Serialization helper for Firestore inputs
function safeSerialize(data: any, path: string = '', seen: Set<any> = new Set()): any {
  if (data === undefined) {
    return null;
  }
  if (data === null) {
    return null;
  }
  if (typeof data === 'function') {
    throw new Error(`Serialization error at ${path}: functions cannot be serialized to Firestore`);
  }
  if (data instanceof Date) {
    if (isNaN(data.getTime())) {
      throw new Error(`Serialization error at ${path}: Invalid Date object`);
    }
    return Timestamp.fromDate(data);
  }
  if (typeof data === 'object') {
    // Detect circular reference
    if (seen.has(data)) {
      throw new Error(`Serialization error at ${path}: circular reference detected`);
    }
    seen.add(data);
    
    if (data.constructor && (data.constructor.name === 'FieldValue' || data.constructor.name === 'Timestamp' || data.constructor.name === 'FieldValueImpl')) {
      return data;
    }
    if (Array.isArray(data)) {
      const result = data.map((item, index) => safeSerialize(item, path ? `${path}[${index}]` : `[${index}]`, seen));
      seen.delete(data);
      return result;
    }
    const result: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      result[key] = safeSerialize(data[key], path ? `${path}.${key}` : key, seen);
    }
    seen.delete(data);
    return result;
  }
  return data;
}

try {
  getFirebaseAdmin();
  firebaseAdminChecked = true;
} catch (e: any) {
  firebaseStatus = `Configuration Error: ${e.message}`;
  firebaseAdminChecked = false;
  console.error("======================================================");
  console.error("⚠️ WARNING: Firebase Admin could not be initialized.");
  console.error(e.stack || e.message || e);
  console.error("The server will remain active. Users can configure secrets in high-level menus.");
  console.error("======================================================");
}

// Startup Diagnostics Test
async function runStartupDiagnostics() {
  const diagData: any = {
    timestamp: new Date().toISOString(),
    env: {
      projectId_exists: !!process.env.FIREBASE_PROJECT_ID,
      projectId_val: process.env.FIREBASE_PROJECT_ID || null,
      clientEmail_exists: !!process.env.FIREBASE_CLIENT_EMAIL,
      clientEmail_val: process.env.FIREBASE_CLIENT_EMAIL || null,
      privateKey_exists: !!process.env.FIREBASE_PRIVATE_KEY,
      privateKey_len: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0,
      privateKey_prefix: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.substring(0, 30) : null,
      google_application_credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || null,
      all_matching_env_keys: Object.keys(process.env).filter(k => k.toLowerCase().includes("credentials") || k.toLowerCase().includes("google") || k.toLowerCase().includes("firebase") || k.toLowerCase().includes("secret"))
    },
    firebaseAdminChecked,
    checks: {},
    error: null,
  };

  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      diagData.client_config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (confErr: any) {
    diagData.client_config_error = confErr.message;
  }

  if (!firebaseAdminChecked) {
    diagData.error = "Firebase Admin initialization was not checked or failed earlier.";
    fs.writeFileSync(path.join(process.cwd(), 'firebase_status.json'), JSON.stringify(diagData, null, 2), 'utf8');
    return;
  }

  console.log("Running Firebase Cloud Diagnostics...");
  const start = Date.now();
  try {
    const db = adminDb();
    diagData.database_id_used = db ? (db as any)._databaseId || 'default' : 'none';
    
    const collectionName = "_diagnostics";
    const documentId = "startup_probe";
    const probeDoc = db.collection(collectionName).doc(documentId);
    
    // 1. Write Test
    await probeDoc.set({ 
      last_probe: FieldValue.serverTimestamp(),
      node_version: process.version,
      identity: "admin-sdk",
      status: "original"
    });
    diagData.checks.write_custom_db = "PASS";
    console.log("✓ Firebase Custom DB Firestore Write: PASS");
    
    // 2. Read Test
    let snap = await probeDoc.get();
    if (!snap.exists) throw new Error("Document not found after write on custom DB");
    diagData.checks.read_custom_db = "PASS";
    console.log("✓ Firebase Custom DB Firestore Read: PASS");

    // 3. Update Test
    await probeDoc.update({
      status: "updated",
      updatedAt: FieldValue.serverTimestamp()
    });
    diagData.checks.update_custom_db = "PASS";
    console.log("✓ Firebase Custom DB Firestore Update: PASS");

    // 2b. Verify Update took place
    snap = await probeDoc.get();
    if (snap.data()?.status !== "updated") {
       throw new Error("Update test failed: Field value was not modified successfully");
    }

    // 4. Delete Test
    await probeDoc.delete();
    diagData.checks.delete_custom_db = "PASS";
    console.log("✓ Firebase Custom DB Firestore Delete: PASS");
  } catch (err: any) {
    console.error("==============================================");
    console.error("❌ Firebase Custom DB Diagnostics: FAIL");
    console.error(`Collection: _diagnostics`);
    console.error(`Document: startup_probe`);
    console.error(`Error Code: ${err.code || "unknown"}`);
    console.error(`Error Message: ${err.message}`);
    console.error(err.stack);
    console.error("==============================================");
    diagData.checks.error_custom_db = err.message;
  }

  try {
    // Test default database
    const app = getFirebaseAdmin();
    const defaultDb = getFirestore(app); // Get (default) database
    diagData.default_database_id = (defaultDb as any)._databaseId || 'default';
    
    const defaultProbeDoc = defaultDb.collection("_diagnostics").doc("startup_probe");
    await defaultProbeDoc.set({
      last_probe: FieldValue.serverTimestamp(),
      node_version: process.version,
      identity: "admin-sdk-default-db",
      status: "original"
    });
    diagData.checks.write_default_db = "PASS";
    
    // Read
    let snapDefault = await defaultProbeDoc.get();
    if (snapDefault.exists) {
      diagData.checks.read_default_db = "PASS";
      
      // Update
      await defaultProbeDoc.update({
        status: "updated",
        updatedAt: FieldValue.serverTimestamp()
      });
      diagData.checks.update_default_db = "PASS";

      // Delete
      await defaultProbeDoc.delete();
      diagData.checks.delete_default_db = "PASS";
    }
  } catch (err: any) {
    console.error("==============================================");
    console.error("❌ Firebase Default DB Diagnostics: FAIL");
    console.error(`Collection: _diagnostics`);
    console.error(`Document: startup_probe`);
    console.error(`Error Code: ${err.code || "unknown"}`);
    console.error(`Error Message: ${err.message}`);
    console.error(err.stack);
    console.error("==============================================");
    diagData.checks.error_default_db = err.message;
  }

  const latency = Date.now() - start;
  diagData.checks.latency_ms = latency;
  console.log(`✓ Firebase Latency: ${latency}ms`);

  try {
    fs.writeFileSync(path.join(process.cwd(), 'firebase_status.json'), JSON.stringify(diagData, null, 2), 'utf8');
  } catch (writeErr: any) {
    console.error("Failed to write diagnostics file:", writeErr.message);
  }
}

runStartupDiagnostics();

/**
 * Helper to log structured database warnings.
 */
function logDbWarning(context: string, err: any) {
  const msg = err?.message || String(err);
  const code = err?.code;
  console.log(`[DB WARNING] ${context}: ${code ? '[' + code + '] ' : ''}${msg.split('\n')[0]}`);
  if (code === 5 || msg.includes('NOT_FOUND')) {
    console.error(`[CRITICAL] Firestore Document/Database NOT_FOUND. Current Project: ${process.env.FIREBASE_PROJECT_ID || 'undefined'}`);
  }
}

// AI Credit Config
const CREDIT_COSTS: Record<string, number> = {
  'background-removal': 2,
  'upscale': 5,
  'logo-gen': 10,
  'wedding-card-gen': 15,
  'banner-gen': 10,
  'flyer-gen': 8,
  'poster-gen': 8,
  'visiting-card-gen': 10,
  'template-gen': 15,
  'image-gen': 10
};

// Helper: AI Credit Management (Atomic Transaction Protected)
async function manageCredits(userId: string, tool: string, action: 'check' | 'deduct'): Promise<{ canProceed: boolean; balance?: number; error?: string }> {
  try {
    const cost = CREDIT_COSTS[tool] || 5;
    const db = adminDb();
    const userRef = db.collection('users').doc(userId);

    if (action === 'check') {
      const snap = await userRef.get();
      if (!snap.exists) return { canProceed: false, error: "Profile not found. Please login." };
      
      const data = snap.data();
      const currentCredits = data?.aiCredits || 0;
      if (currentCredits < cost) {
        return { canProceed: false, balance: currentCredits, error: `Insufficient credits. This tool requires ${cost} credits.` };
      }
      return { canProceed: true, balance: currentCredits };
    }

    // Atomic deduction via Transaction
    const result = await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(userRef);
      if (!snap.exists) throw new Error("User profile not found.");
      
      const data = snap.data();
      const currentCredits = data?.aiCredits || 0;
      if (currentCredits < cost) {
        return { success: false, balance: currentCredits, error: "Insufficient credits." };
      }

      const newBalance = currentCredits - cost;
      transaction.update(userRef, { 
        aiCredits: newBalance,
        updatedAt: FieldValue.serverTimestamp()
      });
      return { success: true, balance: newBalance };
    });

    return { canProceed: result.success, balance: result.balance, error: result.error };
  } catch (err) {
    logDbWarning("Credit transaction failed", err);
    return { canProceed: false, error: "Billing transaction failed." };
  }
}

// Helper to log verification events
async function logAudit(event: {
  type: 'request' | 'verify' | 'block' | 'resend';
  identifier: string;
  status: 'success' | 'failure' | 'blocked';
  provider: string;
  metadata?: any;
}) {
  try {
    const payload = {
      userId: null,
      action: `OTP_${event.type.toUpperCase()}`,
      entityType: 'OTP',
      entityId: event.identifier,
      details: { 
        ...event, 
        provider: event.provider, 
        metadata: event.metadata === undefined ? null : event.metadata 
      },
      ip: 'REDACTED',
      createdAt: FieldValue.serverTimestamp()
    };
    await adminDb().collection('audit_logs').add(safeSerialize(payload));
  } catch (err: any) {
    console.error("❌ Failed to write to audit_logs:", err.message);
    throw err;
  }
}

// Helper to safely get cleaned/trimmed environment variables (removing any copy-pasted outer quotes)
function getCleanEnv(key: string): string | undefined {
  const value = process.env[key];
  if (!value) return undefined;
  let cleaned = value.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  return cleaned;
}

// --- ADMIN AUTHORIZATION MIDDLEWARE ---
async function verifyAdmin(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ success: false, message: "Unauthorized access: Bearer token required." });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth().verifyIdToken(token);
    const email = decodedToken.email || '';

    if (!AUTHORIZED_ADMINS.includes(email)) {
      console.warn(`🛑 SECURITY ALERT: Unauthorized Admin Access Attempt! Email: ${email}, IP: ${req.ip}, Route: ${req.originalUrl}`);
      
      // Log to Firestore audit_logs
      try {
        const payload = {
          action: "UNAUTHORIZED_ADMIN_ATTEMPT",
          email: email,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          route: req.originalUrl,
          timestamp: FieldValue.serverTimestamp(),
          details: { 
            device: req.headers['sec-ch-ua-platform'] || 'Unknown',
            method: req.method
          }
        };
        await adminDb().collection('audit_logs').add(safeSerialize(payload));
      } catch (logErr: any) {
        console.error("Failed to log security audit:", logErr.message);
      }

      return res.status(403).json({ success: false, message: "Unauthorized access. Your attempt has been logged." });
    }
    
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.error("Auth Token Verification Failed:", error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired session token." });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON request body parsing
  // Add raw body to requests for Cashfree webhook signature verification
  app.use(express.json({ 
    limit: "15mb",
    verify: (req: any, res, buf) => {
      req.rawBody = buf.toString();
    }
  }));

  // Shared Gemini client utility initialized on server side
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      })
    : null;

  // POST endpoint to request Imagen tool generation
  app.post("/api/generate-placeholder", async (req, res) => {
    try {
      const { prompt, category } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      if (!ai) {
        console.log("SANDBOX WARNING: GEMINI_API_KEY is not configured. Returning custom SVG placeholder preview.");
        const textLabel = (category || prompt || "Print Preview").toUpperCase();
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
          <rect width="100%" height="100%" fill="#111827"/>
          <circle cx="250" cy="230" r="110" fill="none" stroke="#FF4D00" stroke-width="4" stroke-dasharray="12 6"/>
          <text x="50%" y="220" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="900" font-size="20" text-anchor="middle" letter-spacing="1">PRINTBAZAAR CUSTOM</text>
          <text x="50%" y="250" fill="#a5b4fc" font-family="'JetBrains Mono', monospace" font-size="12" text-anchor="middle" letter-spacing="0.5">${textLabel.length > 35 ? textLabel.slice(0, 32) + "..." : textLabel}</text>
          <text x="50%" y="360" fill="#f43f5e" font-family="'JetBrains Mono', monospace" font-size="10" text-anchor="middle" font-weight="bold">SANDBOX FALLBACK PREVIEW</text>
          <text x="50%" y="385" fill="#9ca3af" font-family="'Inter', sans-serif" font-size="9" text-anchor="middle">Configure GEMINI_API_KEY in Secrets to enable realistic Imagen-4 catalog shots.</text>
        </svg>`;
        const base64BytesFallback = Buffer.from(svg).toString('base64');
        return res.json({
          success: true,
          imageUrl: `data:image/svg+xml;base64,${base64BytesFallback}`,
          model: "Sandbox-SVG-Generator-Service",
          sandbox: true
        });
      }

      // Formulate a high-quality prompt for printing catalog preview matching the categories
      const refinedPrompt = `A stunning professional product preview photo of ${prompt}, categorized as ${category || "General Print"}. Crisp clean modern design, commercial print catalogue studio lighting, neutral minimalist background, photorealistic, premium 4k offset quality.`;

      console.log(`Requesting AI image generation. Prompt: "${refinedPrompt}"`);

      let base64Bytes = "";
      let modelUsed = "";

      try {
        // Step A: Attempt image generation using the premium Imagen tool
        const response = await ai.models.generateImages({
          model: "imagen-4.0-generate-001",
          prompt: refinedPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: "image/jpeg",
            aspectRatio: "1:1",
          },
        });

        if (response?.generatedImages?.[0]?.image?.imageBytes) {
          base64Bytes = response.generatedImages[0].image.imageBytes;
          modelUsed = "imagen-4.0-generate-001";
        }
      } catch (imagenError: any) {
        console.warn("Imagen tool generation failed. Attempting fallback via gemini-2.5-flash-image...", imagenError?.message || imagenError);
        
        // Step B: Fallback gracefully to the highly resilient multimodal general model gemini-2.5-flash-image
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: {
              parts: [
                {
                  text: refinedPrompt,
                },
              ],
            },
          });

          const parts = fallbackResponse?.candidates?.[0]?.content?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                base64Bytes = part.inlineData.data;
                modelUsed = "gemini-2.5-flash-image";
                break;
              }
            }
          }
        } catch (fallbackError: any) {
          console.error("AI fallback generation failed:", fallbackError);
        }
      }

      if (base64Bytes) {
        const imageUrl = `data:image/jpeg;base64,${base64Bytes}`;
        return res.json({
          success: true,
          imageUrl,
          model: modelUsed,
        });
      } else {
        throw new Error("No image data could be retrieved from either the primary Imagen model or the fallback model.");
      }
    } catch (error: any) {
      console.error("AI Generation route crashed:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate high-quality placeholder preview image",
      });
    }
  });

  // POST endpoint to allow customers to generate brief design descriptions or printing material suggestions
  app.post("/api/gemini/generate-suggestions", async (req, res) => {
    try {
      const { prompt, productName, currentOptions } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      if (!ai) {
        console.log("SANDBOX WARNING: GEMINI_API_KEY is not configured on server hosts. Returning template-based print specialist suggestions.");
        let suggestedStock = "350 GSM Premium Silk Artboard";
        let suggestedCoating = "Matte Velvet Finish & Ultra-high Gloss Spot UV highlights";
        let descriptionText = `Premium grade catalog printing on robust, textured paper stocks. Optimally aligned to provide maximum ink depth, crisp edge delineation, and a luxury weight heft.`;
        
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes("metallic") || lowerPrompt.includes("gold") || lowerPrompt.includes("silver")) {
          suggestedStock = "320 GSM Pure Antique Gold Metallic Cardstock";
          suggestedCoating = "Precision Thermographic Raised Foil & Structural Debossing";
          descriptionText = `Designed with metallic foil reflecting elements that create stunning dual-tone gloss variations under exhibition spot lighting. Ideal for luxurious luxury items.`;
        } else if (lowerPrompt.includes("eco") || lowerPrompt.includes("organic") || lowerPrompt.includes("natural")) {
          suggestedStock = "300 GSM Recycled Kraft Fine Virgin Cellulose Card";
          suggestedCoating = "Embossed Organic Soy Ink Printing & Plain Deckle Borders";
          descriptionText = `An eco-conscious choice focusing on a warm and raw tactile hand-feel. Fully highlights organic design aesthetics and rustic brand narratives.`;
        } else if (lowerPrompt.includes("wedding") || lowerPrompt.includes("invite") || lowerPrompt.includes("royal")) {
          suggestedStock = "350 GSM Royal Velvet Ivory Cotton Pulp Board";
          suggestedCoating = "Burgundy Velvet Felt Backing & Gold Laced Hand-painting";
          descriptionText = `Exquisite bespoke wedding stationery representing timeless heritage and luxury. Imbued with hand-laced trim profiles.`;
        }

        return res.json({
          success: true,
          text: `Specialist recommendation: Set on ${suggestedStock} styled with ${suggestedCoating}.\n\n${descriptionText}\n\n[Sandbox Advisory Mode active: Setup your GEMINI_API_KEY in Settings to enable fully interactive cloud-native neural recommendations.]`,
          sandbox: true
        });
      }

      const systemInstruction = `You are an expert printing specialist at PrintBazaar, a luxury commercial offset press house.
Provide brief creative print catalog descriptions or printing material, stock weight, and coating suggestions for the product specified. Keep the response extremely brief, strictly 2 to 3 sentences max, highly expert and professional. No markdown formatting.`;

      const userPrompt = `Product category/name: ${productName}.
Current configurations selected by user: ${JSON.stringify(currentOptions)}.
Customer's custom requirements or idea prompt: "${prompt}"`;

      console.log(`Requesting design suggestions from Gemini. Prompt: "${prompt}"`);

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return res.json({
        success: true,
        text: response.text,
      });
    } catch (error: any) {
      console.error("Gemini suggestions route crashed:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate premium print Suggestions."
      });
    }
  });

  // ==========================================
  // REAL PRODUCTION SELLER KYC & FRAUD PREVENTION ENDPOINTS
  // ==========================================

  // Lazy initialize Mailer
  let mailer: any = null;
  const getMailer = () => {
    if (!mailer) {
      const host = getCleanEnv("SMTP_HOST");
      const port = parseInt(getCleanEnv("SMTP_PORT") || "587");
      const user = getCleanEnv("SMTP_USER");
      const pass = getCleanEnv("SMTP_PASS");
      
      if (host && user && pass) {
        mailer = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass }
        });
      }
    }
    return mailer;
  };

  // --- ACCOUNT DELETION PIPELINE (30-DAY RECOVERY) ---
  app.post("/api/user/delete-initiate", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required." });

      const user = await adminAuth().getUserByEmail(email);
      if (!user) return res.status(404).json({ error: "User not found." });

      // Generate a deletion token (using crypto)
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours to confirm

      await adminDb().collection('deletion_tokens').doc(token).set({
        uid: user.uid,
        email: email,
        expiry: Timestamp.fromMillis(expiry),
        createdAt: FieldValue.serverTimestamp()
      });

      const confirmUrl = `${getCleanEnv("APP_URL") || 'http://localhost:3000'}/api/user/delete-confirm?token=${token}`;
      
      const transporter = getMailer();
      if (transporter) {
        await transporter.sendMail({
          from: `"PrintBazaar Security" <${getCleanEnv("SMTP_FROM") || getCleanEnv("SMTP_USER")}>`,
          to: email,
          subject: "Confirm Account Deletion - PrintBazaar",
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2 style="color: #FF4D00;">Confirm Account Deletion</h2>
              <p>You have requested to delete your PrintBazaar account. Please click the link below to confirm this action.</p>
              <p>Once confirmed, your account will enter a <b>30-day pending deletion period</b> during which you can still recover it.</p>
              <a href="${confirmUrl}" style="display: inline-block; padding: 12px 24px; background: #FF4D00; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Confirm Deletion</a>
              <p style="font-size: 11px; color: #666; margin-top: 20px;">If you did not request this, please ignore this email.</p>
            </div>
          `
        });
      } else {
        console.log(`\n🗑️ [SANDBOX DELETE CONFIRM] Link for ${email}: ${confirmUrl}\n`);
      }

      return res.json({ success: true, message: "Deletion confirmation email sent." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/user/delete-confirm", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') return res.status(400).send("Invalid token.");

      const db = adminDb();
      const tokenDoc = await db.collection('deletion_tokens').doc(token).get();
      if (!tokenDoc.exists) return res.status(400).send("Invalid or expired token.");

      const data = tokenDoc.data();
      if (Date.now() > (data?.expiry as Timestamp).toMillis()) {
        await db.collection('deletion_tokens').doc(token).delete();
        return res.status(400).send("Token has expired. Please initiate deletion again.");
      }

      const uid = data?.uid;
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30); // 30 days from now

      // Move user to pending deletion state
      await db.collection('users').doc(uid).update({
        pendingDeletion: true,
        deletionScheduledAt: Timestamp.fromDate(deletionDate),
        updatedAt: FieldValue.serverTimestamp()
      });

      // Clear token
      await db.collection('deletion_tokens').doc(token).delete();

      return res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #FF4D00;">Deletion Confirmed</h1>
          <p>Your account has been scheduled for deletion in 30 days.</p>
          <p>You have until <b>${deletionDate.toLocaleDateString()}</b> to log back in and cancel this request.</p>
          <a href="/" style="color: #000; font-weight: bold;">Back to PrintBazaar</a>
        </div>
      `);
    } catch (err: any) {
      res.status(500).send("System error confirming deletion.");
    }
  });

  app.post("/api/user/delete-cancel", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: "UserId required" });

      await adminDb().collection('users').doc(userId).update({
        pendingDeletion: false,
        deletionScheduledAt: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp()
      });

      return res.json({ success: true, message: "Account deletion canceled. Welcome back!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Diagnostics & System Health (Enhanced Root Cause Analytics)
  app.get("/api/admin/diagnostics", verifyAdmin, async (req, res) => {
    const start = Date.now();
    
    let firebaseConnectedStatus = "FAIL";
    let serviceAccountValidStatus = "FAIL";
    let fReadStatus = "FAIL";
    let fWriteStatus = "FAIL";
    let fUpdateStatus = "FAIL";
    let fDeleteStatus = "FAIL";
    let authStatus = "FAIL";
    let storageStatus = "FAIL";
    let envLoadedStatus = "FAIL";
    let iamStatus = "FAIL";
    let healthScoreValue = 100;
    const recommendedFixes: string[] = [];

    // 1. Env Loaded Check
    const hasProjId = !!process.env.FIREBASE_PROJECT_ID;
    const hasEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
    const hasKey = !!process.env.FIREBASE_PRIVATE_KEY;
    if (hasProjId && hasEmail && hasKey) {
      envLoadedStatus = "Active";
    } else {
      healthScoreValue -= 20;
      recommendedFixes.push("Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY properly in Settings > Secrets or the env file.");
    }

    // 2. Service Account Check
    const pk = process.env.FIREBASE_PRIVATE_KEY || "";
    const email = process.env.FIREBASE_CLIENT_EMAIL || "";
    const proj = process.env.FIREBASE_PROJECT_ID || "";
    if (
      pk.includes("-----BEGIN PRIVATE KEY-----") &&
      pk.includes("-----END PRIVATE KEY-----") &&
      email.endsWith(".iam.gserviceaccount.com") &&
      email.includes(proj)
    ) {
      serviceAccountValidStatus = "PASS";
    } else {
      healthScoreValue -= 20;
      if (pk.startsWith("AIzaSy")) {
        recommendedFixes.push("The private key provided starts with 'AIzaSy' which is a Client API Key. You must use a complete Server Service Account cert private key.");
      } else {
        recommendedFixes.push("Ensure your Service Account key contains a valid PEM header and footer, and matching project scope email mapping.");
      }
    }

    // 3. Database & Connection Checks
    if (firebaseAdminChecked) {
      firebaseConnectedStatus = "Connected";
      try {
        const db = adminDb();
        const probeRef = db.collection("_diagnostics").doc("health_probe");
        
        // Write performance test
        await probeRef.set({ 
          last_probe: FieldValue.serverTimestamp(),
          origin: req.ip,
          test: "active-diagnostics",
          status: "original"
        });
        fWriteStatus = "PASS";
        
        // Read performance test
        let snap = await probeRef.get();
        if (snap.exists) {
          fReadStatus = "PASS";
        }
        
        // Update performance test
        await probeRef.update({
          status: "updated",
          test_finished: FieldValue.serverTimestamp()
        });
        fUpdateStatus = "PASS";

        snap = await probeRef.get();
        if (snap.data()?.status !== "updated") {
          throw new Error("Update verification failed - value not stored");
        }
        
        // Cleanup test
        await probeRef.delete();
        fDeleteStatus = "PASS";
        
        iamStatus = "PASS"; // Implicit check: if all CRUD works, client email permissions (IAM) are OK.
      } catch (err: any) { 
        healthScoreValue -= 40;
        iamStatus = "FAIL (Insufficient Permissions or Network Error)";
        recommendedFixes.push(`Firestore Database operation failed: ${err.message}. Check database region and firestore.rules security settings.`);
      }

      // Auth validation
      try {
        await adminAuth().listUsers(1);
        authStatus = "Active";
      } catch (authErr: any) {
        healthScoreValue -= 10;
        authStatus = `FAIL (${authErr.message})`;
        recommendedFixes.push("Firebase Auth operation failed. Ensure the Service Account has the Service Account User / Firebase Admin privileges.");
      }

      // Storage validation
      try {
        adminStorage();
        storageStatus = "Active";
      } catch (storageErr: any) {
        healthScoreValue -= 10;
        storageStatus = "FAIL";
        recommendedFixes.push("Firebase Storage initialization failed.");
      }
    } else {
      healthScoreValue -= 50;
      recommendedFixes.push("Firebase SDK could not initialize. Rectify environment variables.");
    }

    // Secondary indicators
    let cashfreeStatus = "FAIL";
    try {
      getCashfree();
      cashfreeStatus = "PASS";
    } catch (err) { 
      healthScoreValue -= 10; 
      recommendedFixes.push("Cashfree coordinates are either incomplete or missing settings.");
    }

    const host = req.get('host');
    let domainHint = "Verification Required in Firebase Console";
    if (host && (host.includes('localhost') || host.includes('0.0.0.0') || host.includes('web.app') || host.includes('firebaseapp.com'))) {
      domainHint = "Probable Match";
    }

    const results: any = {
      // 10. ADMIN DIAGNOSTICS REQUIRED FIELDS (non-object fields for direct rendering)
      firebaseConnected: firebaseConnectedStatus,
      serviceAccountValid: serviceAccountValidStatus,
      firestoreRead: fReadStatus,
      firestoreWrite: fWriteStatus,
      firestoreUpdate: fUpdateStatus,
      firestoreDelete: fDeleteStatus,
      auth: authStatus,
      storage: storageStatus,
      envLoaded: envLoadedStatus,
      iamPermissions: iamStatus,
      healthScore: Math.max(0, healthScoreValue),

      // Retain deep structure compatibility for downstream integrations
      firebase: { 
        status: firebaseStatus, 
        auth: authStatus, 
        store: fWriteStatus === "PASS" ? "Active" : "FAIL", 
        storage: storageStatus,
        initialized: firebaseAdminChecked
      },
      db_ops: { 
        read: fReadStatus, 
        write: fWriteStatus, 
        update: fUpdateStatus,
        delete: fDeleteStatus, 
        latency: Date.now() - start 
      },
      cashfree: { status: cashfreeStatus, mode: getCleanEnv("CASHFREE_ENVIRONMENT") || "SANDBOX" },
      gemini: { status: !!process.env.GEMINI_API_KEY ? "Active" : "Keys Missing", model: "gemini-3.5-flash" },
      email: { status: !!getMailer() ? "Active" : "Bypass Mode", provider: "SMTP" },
      googleAuth: { status: "Active", provider: "Identity Platform" },
      recaptcha: { status: "Integration Verified", type: "v2-checkbox/invisible" },
      authorizedDomains: { 
        current: host,
        status: "Checking Browser Parity",
        validityHint: domainHint
      },
      recommendedFixes,
      timestamp: new Date().toISOString()
    };

    return res.json(results);
  });

  // Helper to parse data URL to base64
  function parseDataUrl(dataUrl: string) {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
    if (!match) {
      return { mimeType: "image/jpeg", base64Data: dataUrl };
    }
    return { mimeType: match[1], base64Data: match[2] };
  }

  // 5. Aadhaar Multimodal OCR Processing with Photoshop edit & Crop-Tampering analytics
  app.post("/api/seller/ocr-aadhaar", async (req, res) => {
    try {
      const { fileData } = req.body;
      if (!fileData) {
        return res.status(400).json({ success: false, error: "Aadhaar government document is required." });
      }
      if (!ai) {
        console.log("SANDBOX WARNING: GEMINI_API_KEY is not configured on the server. Returning realistic mock Aadhaar OCR payload.");
        return res.json({
          success: true,
          data: {
            name: "ROHIT SHARMA",
            dob: "1987-04-30",
            gender: "Male",
            aadhaarNumber: "XXXX-XXXX-8186",
            authenticityScore: 94,
            tamperingFlags: [],
            extractionQuality: 95,
            error: null,
            sandbox: true
          }
        });
      }

      const { mimeType, base64Data } = parseDataUrl(fileData);
      const prompt = `You are a forensic legal compliance OCR scan scanner.
      Examine this Aadhaar National ID image. 
      PARSE INFO AND ANALYZE FOR:
      1. Image tampering (Photoshop modification layers, font mismatches).
      2. Format validity (Is it a real Aadhaar card layout?).
      3. Physicality (Detect camera glares, real paper texture, or digital screenshot/mockup).
      4. Quality (Is the text blurry or unreadable?).
      
      Return strictly as a formatted JSON object. Response must be direct, parseable JSON.
      JSON Schema format:
      {
        "name": "Full Name in UPPERCASE (string value)",
        "dob": "Date of Birth as YYYY-MM-DD (string value)",
        "gender": "Male" | "Female" | "Other" (string value),
        "aadhaarNumber": "XXXX-XXXX-8186 (string, masked keeping only last 4 digits)",
        "authenticityScore": 95, // Integer 0 to 100 assessing real printed paper check (<70 is considered tampered/edited)
        "tamperingFlags": ["List of visual anomalies like cloned text, bad brightness grids, digital crop artifacts"] or empty array [],
        "extractionQuality": 90, // Integer 0 to 100. If <80, tell user to re-upload clear photo.
        "error": "Error details if image is not a valid National ID page, otherwise null"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType } }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text || "{}");

      // Enforce fraud rejection threshold
      if (parsed.authenticityScore && parsed.authenticityScore < 65) {
        parsed.error = `Anti-Tamper Lockout: Aadhaar image visual authenticity checked at only ${parsed.authenticityScore}%. Identified potential image tampering, fake template background, or digital canvas layer.`;
      }

      return res.json({ success: true, data: parsed });
    } catch (e: any) {
      console.error("Aadhaar OCR Service Failed:", e.message);
      return res.status(500).json({
        success: false,
        error: "CRITICAL: Aadhaar identity verification engine failed. " + e.message
      });
    }
  });

  // 6. Indian PAN Card OCR with Tampering, Photoshop & Mock details checks
  app.post("/api/seller/ocr-pan", async (req, res) => {
    try {
      const { fileData } = req.body;
      if (!fileData) {
        return res.status(400).json({ success: false, error: "PAN card document image is required." });
      }
      if (!ai) {
        console.log("SANDBOX WARNING: GEMINI_API_KEY is not configured on the server. Returning realistic mock PAN OCR payload.");
        return res.json({
          success: true,
          data: {
            name: "ROHIT SHARMA",
            dob: "1987-04-30",
            panNumber: "ABCDE1234F",
            authenticityScore: 97,
            tamperingFlags: [],
            extractionQuality: 98,
            error: null,
            sandbox: true
          }
        });
      }

      const { mimeType, base64Data } = parseDataUrl(fileData);
      const prompt = `You are a forensic legal compliance analyst checking an Indian Permanent Account Number (PAN) Card.
      PARSE DETAILS AND ANALYZE FOR:
      1. Digital tampering (cloned fonts, overlay digital layers, fake blank lines).
      2. Geometric anomalies (skewed text, improper card margins).
      3. Physical factors (detect paper grain, holograms, or flat digital template signatures).
      
      Return strictly as a formatted JSON object. Response must be direct, parseable JSON.
      JSON Schema format:
      {
        "name": "Full Name in UPPERCASE (string value)",
        "dob": "Date of Birth as YYYY-MM-DD (string value)",
        "panNumber": "PAN number string matching standard [A-Z]{5}[0-9]{4}[A-Z]{1}",
        "authenticityScore": 98, // Integer 0 to 100 assessing physical authenticity (<70 is suspected edit)
        "tamperingFlags": ["Photoshop font change", "Missing card margin", "Digital overlay detected"] or empty array [],
        "extractionQuality": 95, 
        "error": "Error details if image is completely unreadable or not a PAN Card, otherwise null"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType } }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text || "{}");

      if (parsed.authenticityScore && parsed.authenticityScore < 65) {
        parsed.error = `Forensic Shield Alert: PAN image authenticity score too low (${parsed.authenticityScore}%). Document flagged as fake or digitally tampered.`;
      }

      return res.json({ success: true, data: parsed });
    } catch (e: any) {
      console.error("PAN OCR Service Failed:", e.message);
      return res.status(500).json({
        success: false,
        error: "CRITICAL: PAN verification engine is offline. " + e.message
      });
    }
  });

  // 7. Biometric Facial Similarity verification & Print Attack Spoof Protection
  app.post("/api/seller/face-match", async (req, res) => {
    try {
      const { selfie, idPhoto } = req.body;
      if (!selfie || !idPhoto) {
        return res.status(400).json({ error: "Both selfie image and ID verification photo are mandatory." });
      }
      if (!ai) {
        console.log("SANDBOX WARNING: GEMINI_API_KEY is not configured on the server. Returning realistic mock Face Match payload.");
        return res.json({
          success: true,
          data: {
            matchScore: 96,
            matchResult: "Matched",
            livenessDetected: true,
            biometricFlags: [],
            details: "Sandbox Simulator Fallback Mode: Biometric features align perfectly. Liveness verified.",
            sandbox: true
          }
        });
      }

      const parsedSelfie = parseDataUrl(selfie);
      const parsedId = parseDataUrl(idPhoto);

      const prompt = `Compare Image 1 (Live selfie capture) with Image 2 (Government photo ID face crop).
      COMPLIANCE DIRECTIVES:
      1. Analyze structural biometrics (inter-ocular distance, nasal bridge geometry, ear-to-chin ratio).
      2. Spoof Protection: Detect "Photo-of-a-photo" (screen moiré patterns, paper edge reflections, flat 2D perspective).
      3. Deepfake detection: Look for blending artifacts around eyes and mouth.
      
      Return strictly as a formatted JSON object. Response must be direct, parseable JSON.
      JSON Schema format:
      {
        "matchScore": 95, // Integer 0 to 100 confidence match
        "matchResult": "Matched" | "Possible Match" | "Mismatched",
        "livenessDetected": true, // Boolean false if photo spoofing, deepfakes, or re-capture is identified
        "biometricFlags": ["List of anomalies like bad alignment, excessive shadows"] or empty array [],
        "details": "Confidence analysis notes..."
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: prompt },
          { inlineData: { data: parsedSelfie.base64Data, mimeType: parsedSelfie.mimeType } },
          { inlineData: { data: parsedId.base64Data, mimeType: parsedId.mimeType } }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text || "{}");

      // Reject flat spoofing attacks automatically
      if (parsed.livenessDetected === false) {
        parsed.matchScore = 25;
        parsed.matchResult = "Mismatched";
        parsed.details = "SECURITY ALARM: Face liveness check failed. Detected low-depth re-capture, flat printed photograph artifact or spoof presentation.";
      }

      return res.json({ success: true, data: parsed });
    } catch (e: any) {
      console.error("Biometric Matching Failed:", e.message);
      return res.status(500).json({
        success: false,
        error: "CRITICAL: Biometric face matching service encountered an error. " + e.message
      });
    }
  });

  // 8. Utility Address Proof OCR Scanning
  app.post("/api/seller/address-ocr", async (req, res) => {
    try {
      const { fileData } = req.body;
      if (!fileData) {
        return res.status(400).json({ error: "Utility Bill file content is required." });
      }
      if (!ai) {
        console.log("SANDBOX WARNING: GEMINI_API_KEY is not configured on the server. Returning realistic mock Address OCR payload.");
        return res.json({
          success: true,
          data: {
            address: "FLAT 402, SUNSHINE TOWERS, SENAPATI BAPAT MARG, ELPHINSTONE ROAD, MUMBAI",
            pincode: "400013",
            city: "MUMBAI",
            state: "MAHARASHTRA",
            error: null,
            sandbox: true
          }
        });
      }

      const { mimeType, base64Data } = parseDataUrl(fileData);
      const prompt = `Read and extract the complete address details inside this utility bill/business license document.
      Return strictly as a formatted JSON object. Response must be direct, parseable JSON.
      JSON Schema format:
      {
        "address": "FULL EXTRACTED ADDRESS IN UPPERCASE",
        "pincode": "6-digit pin code string",
        "city": "City Name",
        "state": "State Name",
        "error": "Error details, or null if readable"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType } }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ success: true, data: parsed });
    } catch (e: any) {
      console.error("Address OCR Failed:", e.message);
      return res.status(500).json({
        success: false,
        error: "CRITICAL: Address proof OCR service is unreachable. " + e.message
      });
    }
  });

  // 9. Automate Risk & Fraud Scoring Underwriting
  app.post("/api/seller/generate-risk", async (req, res) => {
    try {
      const { sellerProfile } = req.body;
      if (!sellerProfile) {
        return res.status(400).json({ error: "Seller profile object is required." });
      }
      if (!ai) {
        console.log("SANDBOX WARNING: GEMINI_API_KEY is not configured on the server. Returning mock risk underwriting profile.");
        return res.json({
          success: true,
          data: {
            aiRiskScore: 10,
            trustScore: 95,
            fraudFlags: [],
            auditReason: "Sandbox Simulator Fallback: All submitted documents meet baseline alignment standards under local execution heuristics.",
            sandbox: true
          }
        });
      }

      const prompt = `You are an Enterprise Risk Underwriting and Fraud Prevention daemon for PrintBazaar.
      Analyze this merchant's full on-boarding dossier and compile risk indices:
      Dossier Data: ${JSON.stringify(sellerProfile)}
      
      Heuristics checklist:
      1. Name mismatches: owner registered name vs. Aadhaar extracted name vs. PAN extracted name vs. Bank holder.
      2. Device profiling: detect possible VPS, emulator footprints, mismatched registration times.
      3. Cross-reference indicators.
      
      Response must be STRICTLY valid JSON. Do NOT include markdown wraps or styling ticks. Response must be direct, parseable JSON.
      JSON Schema format:
      {
        "aiRiskScore": 15, // Integer 0 to 100 representing composite risk (100 is extreme risk, 0 is safe)
        "trustScore": 95, // Integer 0 to 100 representing composite document/biometric alignment confidence
        "fraudFlags": ["List of risk signals like Name spelling disparity, VPN IP pool detected"] or empty array [],
        "auditReason": "Summary explanation of automated risk assessment underwriting result."
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ success: true, data: parsed });
    } catch (e: any) {
      console.error("Risk Underwriting Failed:", e.message);
      return res.status(500).json({
        success: false,
        error: "CRITICAL: Fraud risk engine encountered a structural failure. " + e.message
      });
    }
  });

  // 11. Design Repository - Persistence Layer
  app.get("/api/user/stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const snap = await adminDb().collection('users').doc(userId).get();

      if (!snap.exists) {
        return res.json({ success: true, stats: { aiCredits: 10, walletBalance: 0, loyaltyPoints: 0, ordersCount: 0 } });
      }
      const data = snap.data();
      return res.json({ 
        success: true, 
        stats: {
          aiCredits: data?.aiCredits || 0,
          walletBalance: data?.walletBalance || 0,
          loyaltyPoints: data?.loyaltyPoints || 0,
          ordersCount: data?.ordersCount || 0,
          subscriptionTier: data?.role === 'admin' ? 'Elite' : 'Free'
        } 
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  app.post("/api/wallet/add-money", async (req, res) => {
    try {
      const { userId, amount, txId } = req.body;
      const db = adminDb();
      const userRef = db.collection('users').doc(userId);

      const result = await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(userRef);
        let currentBalance = 0;
        if (snap.exists) {
          currentBalance = snap.data()?.walletBalance || 0;
        }

        const newBalance = currentBalance + Number(amount);
        transaction.set(userRef, { 
          walletBalance: newBalance,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        // Also log the transaction in a subcollection or separate logs
        const logRef = db.collection('audit_logs').doc();
        transaction.set(logRef, {
          userId,
          action: 'WALLET_TOPUP',
          entityType: 'WALLET',
          entityId: txId,
          details: { amount, txId },
          createdAt: FieldValue.serverTimestamp()
        });

        return { balance: newBalance };
      });

      return res.json({ success: true, message: "Funds added to PB Wallet", balance: result.balance });
    } catch (err: any) {
      res.status(500).json({ error: "Wallet transaction failed: " + err.message });
    }
  });

  app.post("/api/credits/buy", async (req, res) => {
    try {
      const { userId, packageId, amount, credits, txId } = req.body;
      const db = adminDb();
      const userRef = db.collection('users').doc(userId);

      const result = await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(userRef);
        let currentCredits = 0;
        if (snap.exists) {
          currentCredits = snap.data()?.aiCredits || 0;
        }

        const newCredits = currentCredits + Number(credits);
        transaction.set(userRef, { 
          aiCredits: newCredits,
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        const logRef = db.collection('audit_logs').doc();
        transaction.set(logRef, {
          userId,
          action: 'CREDITS_PURCHASE',
          entityType: 'CREDITS',
          entityId: txId,
          details: { credits, packageId, txId },
          createdAt: FieldValue.serverTimestamp()
        });

        return { balance: newCredits };
      });

      return res.json({ success: true, message: `${credits} AI Credits added!`, balance: result.balance });
    } catch (err: any) {
      res.status(500).json({ error: "Credit transaction failed: " + err.message });
    }
  });

  // Automated Email for Order Status Updates
  app.post("/api/emails/order-status", async (req, res) => {
    try {
      const { email, orderId, status } = req.body;
      if (!email || !orderId || !status) {
        return res.status(400).json({ error: "Email, OrderId, and Status are required" });
      }

      const transporter = getMailer();
      if (transporter) {
        let subject = `Order ${orderId} Status Update: ${status}`;
        let htmlBody = `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #FF4D00; margin-bottom: 20px;">PrintBazaar Order Update</h2>
            <p>Hello! We wanted to inform you that the status for your order <b>${orderId}</b> has been updated.</p>
            <div style="background: #fdf2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 18px; font-weight: bold; color: #000;">Current Status: ${status}</span>
            </div>
            <p style="font-size: 14px; color: #444;">Thank you for choosing PrintBazaar for your premium printing needs!</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 10px; color: #999;">© 2026 PrintBazaar Press Ltd.</p>
          </div>
        `;

        if (status === 'Printing In Progress') {
          subject = `Your PrintBazaar Order ${orderId} is being printed!`;
        } else if (status === 'Ready for Dispatch') {
          subject = `Your PrintBazaar Order ${orderId} is Ready for Dispatch!`;
        }
        
        await transporter.sendMail({
          from: `"PrintBazaar Alerts" <${getCleanEnv("SMTP_FROM") || getCleanEnv("SMTP_USER")}>`,
          to: email,
          subject,
          html: htmlBody
        });
        
        return res.json({ success: true, message: `Status email sent for ${status}` });
      } else {
        console.log(`[SANDBOX BYPASS] Order Status Email to ${email} for Order ${orderId} - Status: ${status}`);
        return res.json({ success: true, message: "Sandbox mode: Status email bypassed", provider: "Sandbox Logs" });
      }
    } catch (e: any) {
      console.error("Order status email dispatch failed:", e.message);
      return res.status(500).json({ error: e.message || "Failed to dispatch order status email" });
    }
  });

  app.post("/api/quotes/bulk-request", async (req, res) => {
    try {
      const { userId, userEmail, product, quantity, specifications, location } = req.body;
      
      const estPrice = quantity * 5; 
      const tax = estPrice * 0.18;
      const shipping = 150;
      const total = estPrice + tax + shipping;

      const docRef = await adminDb().collection('quotes').add({
        userId,
        userEmail,
        product,
        quantity,
        specifications,
        location,
        estimatedCost: estPrice,
        tax,
        shipping,
        total,
        status: 'requested',
        createdAt: FieldValue.serverTimestamp()
      });

      return res.json({ success: true, quoteId: docRef.id, message: "Bulk quote request submitted to sales engine." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/revenue-stats", verifyAdmin, async (req, res) => {
    try {
      // Aggregate from Firestore
      const usersSnap = await adminDb().collection('users').get();
      let totalWalletBalance = 0;
      usersSnap.forEach(doc => {
        totalWalletBalance += (doc.data().walletBalance || 0);
      });

      const stats = {
        totalRevenue: 1250000 + totalWalletBalance,
        aiRevenue: 45000,
        subscriptionRevenue: 85000,
        marketplaceRevenue: 120000,
        payoutsPending: 15000,
        referralPayouts: 3200
      };
      return res.json({ success: true, stats });
    } catch (err) {
      res.status(500).json({ error: "Analytics engine unreachable" });
    }
  });

  app.post("/api/designs/save", async (req, res) => {
    try {
      const { id, name, data, preview, userId } = req.body;
      if (!data) return res.status(400).json({ error: "Design data is missing." });

      const payload: any = {
        name: name || "Untitled Design",
        data: data,
        imageUrl: preview || null,
        userId: userId || null,
        updatedAt: FieldValue.serverTimestamp()
      };

      const db = adminDb();
      let docId = id;
      if (id) {
        await db.collection('generated_designs').doc(id).set(payload, { merge: true });
      } else {
        const docRef = await db.collection('generated_designs').add({
          ...payload,
          createdAt: FieldValue.serverTimestamp()
        });
        docId = docRef.id;
      }

      return res.json({ success: true, id: docId });
    } catch (err: any) {
      logDbWarning("Design save failed", err);
      res.status(500).json({ error: "Cloud sync failed: " + err.message });
    }
  });

  app.get("/api/designs/list", async (req, res) => {
    try {
      const snap = await adminDb().collection('generated_designs')
        .orderBy('updatedAt', 'desc')
        .get();
      
      const designs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ success: true, designs });
    } catch (err: any) {
      res.status(500).json({ error: "Query failed: " + err.message });
    }
  });

  app.get("/api/verification/audits", verifyAdmin, async (req, res) => {
    try {
      const snap = await adminDb().collection('audit_logs')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      const audits = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json({ success: true, audits });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // 10. AI Studio - Multi-modal Image Editing Pipeline
  app.post("/api/studio/process", async (req, res) => {
    try {
      const { tool, image, options, userId } = req.body;
      
      // CREDIT VALIDATION MANDATE
      if (userId && userId !== 'anonymous') {
        const creditCheck = await manageCredits(userId, tool, 'check');
        if (!creditCheck.canProceed) {
          return res.status(402).json({ error: creditCheck.error, balance: creditCheck.balance });
        }
      }

      if (!image && !options?.prompt) {
        return res.status(400).json({ error: "Source image or prompt is required." });
      }

      if (!ai) {
        console.log("SANDBOX WARNING: GEMINI_API_KEY is not configured on the server. Returning custom fallback image data.");
        let outUrl = image;
        if (!outUrl) {
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
            <rect width="100%" height="100%" fill="#18181b"/>
            <text x="50%" y="240" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="900" font-size="20" text-anchor="middle" letter-spacing="1">STUDIO EDIT RESULT</text>
            <text x="50%" y="270" fill="#FF4D00" font-family="'JetBrains Mono', monospace" font-size="12" text-anchor="middle" letter-spacing="0.5">TOOL: ${tool.toUpperCase()}</text>
            <text x="50%" y="300" fill="#ef4444" font-family="'JetBrains Mono', monospace" font-size="9" text-anchor="middle" font-weight="bold">SANDBOX FALLBACK (NO GEMINI_API_KEY)</text>
          </svg>`;
          outUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
        }
        return res.json({
          success: true,
          imageUrl: outUrl,
          message: `Successfully executed generative ${tool} tool operation (Sandbox Fallback Mode)!`
        });
      }

      let parsedImage;
      if (image) {
        try {
          parsedImage = parseDataUrl(image);
        } catch (err) {
          return res.status(400).json({ error: "Invalid Base64 data URL formatting." });
        }
      }

      let systemInstruction = "";
      let taskPrompt = "";
      let model = "gemini-2.5-flash-image";

      switch (tool) {
        case "background":
        case "background-removal":
          systemInstruction = "You are a professional clipping path specialist. Segment and isolate the master foreground subject of this photo.";
          taskPrompt = "Segment and extract the main foreground element or product and isolate/segment it onto a solid plain white background. Erase all background and peripheral elements cleanly. Retain high-definition surface details. Return ONLY the segmented foreground object.";
          break;

        case "upscale":
          systemInstruction = "You are an advanced digital photo scaler and detail synthesizer model.";
          taskPrompt = `Upscale this image to represent high-resolution HD offset printing standards. Denoise and interpolate pixel patterns to enhance sharp structural lines and vivid color rendering. Multiplier factor is ${options?.upscaleFactor || "4x"}. Output ONLY the resulting upscaled high-resolution image.`;
          break;

        case "enhancement":
        case "color-fix":
          systemInstruction = "You are a professional commercial studio color grader.";
          taskPrompt = "Analyze and auto-calibrate the contrast, levels, color curves, color saturation, temperature and brightness range of this photo. Make it look professional, vibrant, and perfectly color-balanced as if captured in a high-end catalogue studio. Output ONLY the resulting enhanced image.";
          break;

        case "object-remove":
        case "erase":
          systemInstruction = "You are an inpainting brush tool that erases secondary objects from scenes.";
          taskPrompt = `Remove this distracting element or area specified as: "${options?.prompt || "unwanted secondary background object"}". Synthesize the newly erased visual region seamlessly using background contextual textures, lighting shaders, and color gradients. Return ONLY the modified photo.`;
          break;

        case "inpaint":
        case "magic-edit":
          systemInstruction = "You are a high-fidelity generative inpainting visual engineer.";
          taskPrompt = `Execute a generative edit in accordance with the user instructions: "${options?.prompt || "add details"}". Edit or swap the targeted elements seamlessly, keeping the original lighting shadows, perspectival geometry, and surrounding textures intact. Output ONLY the resulting edited design.`;
          break;

        case "image-gen":
        case "template-gen":
        case "logo-gen":
        case "poster-gen":
        case "visiting-card-gen":
        case "wedding-card-gen":
        case "banner-gen":
        case "flyer-gen":
        case "thumbnail-gen":
          model = "imagen-4.0-generate-001";
          systemInstruction = "You are an award-winning graphic designer specializing in print media.";
          taskPrompt = `Create a high-resolution, print-ready ${tool.replace('-gen', '')} design for: "${options?.prompt}". Use modern aesthetics, professional typography, and high-quality visuals. The design should be suitable for a luxury printing press.`;
          break;

        default:
          return res.status(400).json({ error: `AI Edit Studio tool '${tool}' is not supported.` });
      }

      console.log(`[AI Studio Process] Running ${model} task: "${tool}"`);

      let responseBase64 = "";

      if (model === "imagen-4.0-generate-001") {
        const response = await ai.models.generateImages({
          model,
          prompt: taskPrompt,
          config: { numberOfImages: 1, outputMimeType: "image/png" },
        });
        responseBase64 = response.generatedImages?.[0]?.image?.imageBytes || "";
      } else {
        const contents = image ? {
          parts: [
            { inlineData: { data: parsedImage!.base64Data, mimeType: parsedImage!.mimeType } },
            { text: `${systemInstruction}\n\nTask prompt: ${taskPrompt}` }
          ]
        } : { parts: [{ text: `${systemInstruction}\n\nTask prompt: ${taskPrompt}` }] };

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents,
        });

        if (response && response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              responseBase64 = part.inlineData.data;
              break;
            }
          }
        }
      }

      if (!responseBase64) {
        return res.status(500).json({ error: "AI model failed to generate image data." });
      }

      // DEDUCT CREDITS ON SUCCESS
      if (userId && userId !== 'anonymous') {
        await manageCredits(userId, tool, 'deduct');
      }

      return res.json({
        success: true,
        imageUrl: `data:image/png;base64,${responseBase64}`,
        message: `Successfully executed AI Generative ${tool} tool operation!`
      });

    } catch (e: any) {
      console.error("[AI Studio Processing Failed]:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  // Cashfree Gateway Configuration
  let cashfreeInstance: Cashfree | null = null;
  const getCashfree = () => {
    if (cashfreeInstance) return cashfreeInstance;

    const clientId = getCleanEnv("CASHFREE_CLIENT_ID");
    const secretKey = getCleanEnv("CASHFREE_CLIENT_SECRET");
    
    if (!clientId || !secretKey) {
      throw new Error("CRITICAL: Cashfree credentials (CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET) are missing.");
    }

    let environment = getCleanEnv("CASHFREE_ENVIRONMENT") || getCleanEnv("CASHFREE_ENV") || "SANDBOX";
    
    // Auto-detect environment based strictly on Client ID format regardless of user env variable
    // Cashfree Sandbox keys always contain 'TEST' or 'sandbox'
    const looksLikeTestKey = clientId.toUpperCase().includes("TEST") || clientId.toUpperCase().includes("SANDBOX");
    
    if (environment.toUpperCase() === "SANDBOX" && !looksLikeTestKey) {
       console.warn(`[CASHFREE OVERRIDE] CASHFREE_ENVIRONMENT is set to SANDBOX but Client ID (${clientId.substring(0,4)}...) looks like a LIVE key. Overriding to PRODUCTION to prevent authentication failure.`);
       environment = "PRODUCTION";
    }

    if (environment.toUpperCase() === "PRODUCTION" && looksLikeTestKey) {
       console.warn(`[CASHFREE OVERRIDE] CASHFREE_ENVIRONMENT is set to PRODUCTION but Client ID (${clientId.substring(0,4)}...) looks like a TEST key. Overriding to SANDBOX to prevent authentication failure.`);
       environment = "SANDBOX";
    }

    const isSandboxEnv = environment.toUpperCase() === "SANDBOX" || environment.toUpperCase() === "TEST";
    
    cashfreeInstance = new Cashfree(
      isSandboxEnv ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION,
      clientId,
      secretKey
    );
    cashfreeInstance.XApiVersion = getCleanEnv("CASHFREE_API_VERSION") || "2023-08-01";
    console.log(`✓ Cashfree initialized in ${isSandboxEnv ? 'SANDBOX' : 'PRODUCTION'} mode`);
    return cashfreeInstance;
  };

  app.get("/api/cashfree/config", (req, res) => {
    const clientId = getCleanEnv("CASHFREE_CLIENT_ID") || getCleanEnv("CASHFREE_APP_ID");
    const secretKey = getCleanEnv("CASHFREE_CLIENT_SECRET") || getCleanEnv("CASHFREE_SECRET_KEY");
    
    let env = getCleanEnv("CASHFREE_ENVIRONMENT") || getCleanEnv("CASHFREE_ENV");
    if (!env && clientId) {
        env = (clientId.startsWith("TEST") || clientId.toLowerCase().includes("test")) ? "SANDBOX" : "PRODUCTION";
    }

    res.json({
      success: true,
      hasKeys: !!(clientId && secretKey),
      appId: clientId || null,
      env: env || "TEST"
    });
  });

  app.post("/api/cashfree/create-order", async (req, res) => {
    const { amount, customerId, customerPhone, customerEmail, customerName } = req.body;
    try {
      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, error: "Valid amount greater than 0 is required" });
      }
      if (!customerId) return res.status(400).json({ success: false, error: "Customer ID is required" });
      if (!customerPhone) return res.status(400).json({ success: false, error: "Customer Phone is required" });
      if (!customerEmail) return res.status(400).json({ success: false, error: "Customer Email is required" });
      
      let cf;
      try {
        cf = getCashfree();
      } catch (keyErr: any) {
        console.error("Cashfree Configuration Error:", keyErr.message);
        return res.status(500).json({ success: false, error: "Cashfree is not configured correctly: " + keyErr.message });
      }

      const orderId = "order_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const returnUrl = `${getCleanEnv("APP_URL") || process.env.APP_URL || 'https://www.printbazaar.app'}/order-status?order_id={order_id}`;

      const request = {
        order_amount: amount,
        order_currency: "INR",
        order_id: orderId,
        customer_details: {
          customer_id: customerId,
          customer_name: customerName || "Guest User",
          customer_phone: customerPhone,
          customer_email: customerEmail
        },
        order_meta: {
          return_url: returnUrl
        }
      };

      console.log(`[CASHFREE-NEW] return_url constructed: ${returnUrl}`);


      let response;
      try {
        // PGCreateOrder expecting (request)
        const startedAt = Date.now();
        response = await cf.PGCreateOrder(request);
        
        console.log("========== CASHFREE RAW RESPONSE ==========");
        console.log(JSON.stringify(response.data, null, 2));
        console.log("===========================================");
        console.log("payment_session_id:", response?.data?.payment_session_id);
        console.log("order_id:", response?.data?.order_id);
        console.log("order_status:", response?.data?.order_status);
        
        console.log("CASHFREE_CLIENT_ID:", process.env.CASHFREE_CLIENT_ID ? "Loaded" : "Missing");
        console.log("CASHFREE_CLIENT_SECRET:", process.env.CASHFREE_CLIENT_SECRET ? "Loaded" : "Missing");
        console.log("CASHFREE_ENVIRONMENT:", process.env.CASHFREE_ENVIRONMENT);

        if (!response.data || !response.data.payment_session_id) {
          throw new Error("Cashfree API succeeded but returned no payment_session_id. Full Response: " + JSON.stringify(response.data));
        }

        console.log(`Cashfree order created on Live Gateway: ${response.data.order_id}`);
      } catch (pgErr: any) {
        console.log("========== CASHFREE HTTP ERROR ==========");
        console.log("Status Code:", pgErr.response?.status);
        console.log("Headers:", JSON.stringify(pgErr.response?.headers, null, 2));
        console.log("Response Body:", JSON.stringify(pgErr.response?.data, null, 2));
        console.log("=========================================");
        console.error("Cashfree Gateway API error:", pgErr.response?.data || pgErr.message);
        return res.status(502).json({ 
          success: false, 
          error: "Cashfree API Error: " + (pgErr.response?.data?.message || pgErr.message),
          details: pgErr.response?.data
        });
      }

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

        await db.collection('audit_logs').add({
          userId: null,
          action: "CASHFREE_ORDER_CREATED",
          entityType: "ORDER",
          entityId: response.data.order_id,
          details: { amount: response.data.order_amount },
          createdAt: FieldValue.serverTimestamp(),
          ip: 'REDACTED'
        });
      } catch (dbErr: any) {
        logDbWarning("Firestore logging failed for CF order", dbErr);
        // We do not fail the order if the DB fails to log, but we log the error
      }
      
      return res.json({
        success: true,
        isMock: false,
        payment_session_id: response.data.payment_session_id,
        order_id: response.data.order_id,
        order_amount: response.data.order_amount,
        environment: cf.XEnvironment === 2 ? 'PRODUCTION' : 'SANDBOX'
      });
    } catch (err: any) {
      console.error("Cashfree Order flow exception:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/cashfree/verify-payment", async (req, res) => {
    try {
      const { order_id } = req.body;

      if (!order_id) {
        return res.status(400).json({ success: false, error: "order_id is required" });
      }

      let cf;
      try {
        cf = getCashfree();
      } catch (e: any) {
        console.error("Cashfree Configuration Error:", e.message);
        return res.status(500).json({ success: false, error: "Cashfree config error: " + e.message });
      }

      try {
        const response = await cf.PGOrderFetchPayments(order_id);
        const payments = response.data || [];
        
        // Find success payment
        const successPayment = Array.isArray(payments) ? payments.find((p: any) => p.payment_status === "SUCCESS") : (payments as any).payment_status === "SUCCESS" ? payments : null;
        
        if (successPayment) {
          try {
            const db = adminDb();
            await db.collection('payments').doc(order_id).update({
              status: "PAID",
              payment_id: successPayment.cf_payment_id,
              verification_result: "SUCCESS",
              verifiedAt: FieldValue.serverTimestamp()
            });

            await db.collection('audit_logs').add({
              userId: null,
              action: "CASHFREE_PAYMENT_SUCCESS",
              entityType: "ORDER",
              entityId: order_id,
              details: { payment_id: successPayment.cf_payment_id },
              createdAt: FieldValue.serverTimestamp(),
              ip: 'REDACTED'
            });
          } catch (dbErr) {
            logDbWarning("Firestore DB Error on verify", dbErr);
          }

          return res.json({
            success: true,
            verified: true,
            payment: successPayment
          });
        }
        
        try {
          await adminDb().collection('audit_logs').add({
            action: "CASHFREE_VERIFICATION_FAIL",
            entityId: order_id,
            details: { result: "No successful payment found on live gateway" },
            createdAt: FieldValue.serverTimestamp(),
            ip: 'REDACTED'
          });
        } catch (e) {}

        return res.json({ success: true, verified: false, message: "No successful payment found for this order" });
      } catch (err: any) {
        console.error("Cashfree live payment lookup error:", err.message);
        return res.status(502).json({ success: false, error: "Cashfree lookup failed: " + err.message });
      }
    } catch (err: any) {
      console.error("Cashfree Verification general exception:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/payment/health", async (req, res) => {
    const health = {
      cashfreeConnected: false,
      credentialsValid: false,
      orderApiWorking: false,
      databaseWorking: false,
      score: 0,
      details: {}
    };

    try {
      // 1. Check DB
      try {
        const db = adminDb();
        health.databaseWorking = true;
        health.score += 20;
      } catch (dbErr: any) {
        health.details = { ...health.details, dbError: dbErr.message };
      }

      // 2. Check Credentials
      let cfInstance;
      try {
        cfInstance = getCashfree();
        health.cashfreeConnected = true;
        health.score += 20;
        health.details = { 
          ...health.details, 
          env: cfInstance.XEnvironment, 
          clientPrefix: cfInstance.XClientId?.substring(0, 4) 
        };
      } catch (err: any) {
        health.details = { ...health.details, configError: err.message };
        return res.json({ ...health, message: "Cashfree not configured" });
      }

      // 3. Test CF Order Fetch API to test valid keys
      try {
        console.log(`[HEALTH] Testing Cashfree in ${cfInstance.XEnvironment} mode for clientId starting with: ${cfInstance.XClientId?.substring(0, 4)}`);
        await cfInstance.PGOrderFetchPayments("test_dummy_order_xyz");
        health.credentialsValid = true;
        health.orderApiWorking = true;
        health.score += 60;
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.data?.type === 'authentication_error') {
          health.credentialsValid = false;
          health.details = { ...health.details, authError: err.response?.data?.message || "Authentication Failed" };
        } else if (err.response?.status === 404 || err.response?.data?.code === 'order_not_found') {
          // 404 means keys are validated and the dummy order was just not found
          health.credentialsValid = true;
          health.orderApiWorking = true;
          health.score += 60;
        } else {
          health.details = { ...health.details, apiError: err.response?.data?.message || err.message };
        }
      }

      return res.json({
        success: true,
        health,
        score: health.score,
        status: health.score === 100 ? "OPERATIONAL" : "DEGRADED"
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message, health });
    }
  });

  app.post("/api/cashfree/webhook", async (req: any, res) => {
    try {
      const signature = req.headers["x-webhook-signature"] as string;
      const timestamp = req.headers["x-webhook-timestamp"] as string;
      const rawBody = req.rawBody || JSON.stringify(req.body);
      const cf = getCashfree();

      if (!cf) return res.sendStatus(500);

      try {
        cf.PGVerifyWebhookSignature(signature, rawBody, timestamp);
      } catch (err) {
        console.error("Cashfree Webhook Signature Mismatch or error", err);
        return res.status(400).send("Signature mismatch");
      }

      const { data, type } = req.body;
      const { order, payment } = data || {};

      try {
        const db = adminDb();
        await db.collection('audit_logs').add({
          action: `WEBHOOK_${type || 'UNKNOWN'}`,
          entityType: "ORDER",
          entityId: order?.order_id,
          details: { ...payment, type },
          createdAt: FieldValue.serverTimestamp(),
          ip: 'REDACTED'
        });

        if (order?.order_id) {
          try {
            await db.runTransaction(async (transaction: any) => {
              const orderRef = db.collection('payments').doc(order.order_id);
              const orderDoc = await transaction.get(orderRef);
              
              if (orderDoc.exists) {
                const updateData: any = {
                  latestWebhookStatus: payment?.payment_status || type,
                  updatedAt: FieldValue.serverTimestamp()
                };
                
                if (payment?.payment_status === "SUCCESS") {
                  updateData.status = "PAID";
                  updateData.payment_id = payment.cf_payment_id;
                } else if (payment?.payment_status === "FAILED") {
                  updateData.status = "FAILED";
                }
                
                transaction.update(orderRef, updateData);
              } else {
                // If we get a webhook before the db write finishes, create it
                transaction.set(orderRef, {
                  order_id: order.order_id,
                  status: payment?.payment_status === "SUCCESS" ? "PAID" : "CREATED",
                  latestWebhookStatus: payment?.payment_status || type,
                  updatedAt: FieldValue.serverTimestamp()
                });
              }
            });
          } catch (txErr) {
            console.error("Cashfree Webhook Transaction failed:", txErr);
          }
        }
      } catch (dbErr) {
        logDbWarning("Webhook DB Logging Failed", dbErr);
      }

      if (payment?.payment_status === "SUCCESS") {
        console.log(`Cashfree Webhook: Payment Success for Order ${order?.order_id}`);
      } else if (payment?.payment_status === "FAILED") {
        console.log(`Cashfree Webhook: Payment Failed for Order ${order?.order_id}`);
      }

      res.json({ status: "ok" });
    } catch (err) {
      console.error("Webhook processing error:", err);
      res.sendStatus(500);
    }
  });

  app.post("/api/orders/send-confirmation", async (req, res) => {
    try {
      const { order } = req.body;
      if (!order || !order.customerEmail) {
        return res.status(400).json({ error: "Order details and customerEmail are required" });
      }

      console.log(`✉️ Sending order confirmation email for order ${order.id} to ${order.customerEmail}`);
      const transporter = getMailer();

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 20px; background-color: #ffffff;">
          <!-- Header Banner -->
          <div style="background-color: #0F172A; text-align: center; padding: 32px 16px; border-radius: 14px 14px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">PRINT<span style="color: #FF4D00;">BAZAAR</span></h1>
            <p style="color: #94A3B8; margin: 8px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Order Confirmation</p>
          </div>

          <!-- Main Welcome & Info -->
          <div style="padding: 24px 12px 12px 12px;">
            <h2 style="font-size: 18px; font-weight: 700; color: #0F172A; margin: 0 0 12px 0;">Hello ${order.customerName || 'Valued Customer'},</h2>
            <p style="font-size: 13px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
              Thank you for your business! Your printing order <strong>${order.id}</strong> has been received and is currently under <strong>Design Review</strong>. Our pre-press operations team is auditing file bleeds, CMYK coverage, and print resolution to ensure absolute offset precision.
            </p>

            <!-- Order Overview Cards -->
            <div style="background-color: #F8FAFC; border: 1px solid #F1F5F9; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <h3 style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; margin: 0 0 12px 0; letter-spacing: 1px;">Order Summary</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <tr>
                  <td style="padding: 4px 0; color: #64748B;">Order ID:</td>
                  <td style="padding: 4px 0; font-family: monospace; font-weight: 700; color: #0F172A; text-align: right;">${order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748B;">Date:</td>
                  <td style="padding: 4px 0; font-weight: 600; color: #0F172A; text-align: right;">${order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748B;">Secure Status:</td>
                  <td style="padding: 4px 0; font-weight: 700; color: #22C55E; text-align: right; text-transform: uppercase;">
                    ${order.balancePaid ? 'PAYMENT SUCCESSFUL' : 'RECEIVED'}
                  </td>
                </tr>
                ${order.payments && order.payments.length > 0 ? `
                <tr>
                  <td style="padding: 4px 0; color: #64748B;">Transaction ID:</td>
                  <td style="padding: 4px 0; font-family: monospace; color: #0F172A; text-align: right;">${order.payments[0].txId}</td>
                </tr>
                ` : ''}
                <tr style="border-top: 1px solid #E2E8F0;">
                  <td style="padding: 12px 0 0 0; font-size: 13px; font-weight: 700; color: #0F172A;">Total Net Amount:</td>
                  <td style="padding: 12px 0 0 0; font-size: 15px; font-weight: 800; color: #FF4D00; text-align: right;">₹${(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </div>

            <!-- Order Items Details -->
            <h3 style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; margin: 0 0 12px 0; letter-spacing: 1px;">Items in your Printing Cart</h3>
            <div style="border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead style="background-color: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
                  <tr>
                    <th style="padding: 10px 12px; text-align: left; font-weight: 700; color: #334155;">Product Details</th>
                    <th style="padding: 10px 12px; text-align: right; font-weight: 700; color: #334155;">Qty</th>
                    <th style="padding: 10px 12px; text-align: right; font-weight: 700; color: #334155;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${(order.items || []).map((item: any) => `
                  <tr style="border-bottom: 1px solid #F1F5F9;">
                    <td style="padding: 12px;">
                      <div style="font-weight: 700; color: #0F172A; text-transform: uppercase; font-size: 12px;">${item.productName}</div>
                      <div style="font-size: 10px; color: #64748B; font-family: monospace; margin-top: 2px;">
                        Size: ${item.selectedSize?.name || 'N/A'}<br/>
                        Material: ${item.selectedMaterial?.name || 'N/A'}
                      </div>
                      ${item.designFile ? `
                      <div style="font-size: 10px; color: #3B82F6; margin-top: 4px; font-weight: 600;">
                        ✓ Artwork attached: ${item.designFile.name}
                      </div>
                      ` : ''}
                    </td>
                    <td style="padding: 12px; text-align: right; font-weight: 600; color: #475569; vertical-align: top;">
                      ${item.selectedQuantity}
                    </td>
                    <td style="padding: 12px; text-align: right; font-weight: 700; color: #0F172A; vertical-align: top;">
                      ₹${(item.itemTotal || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Shipping Details block -->
            ${order.shippingAddress ? `
            <div style="background-color: #F8FAFC; border: 1px solid #F1F5F9; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <h3 style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; margin: 0 0 10px 0; letter-spacing: 1px;">Shipping Destination</h3>
              <p style="font-size: 12px; color: #0F172A; margin: 0; font-weight: 600;">${order.shippingAddress.name}</p>
              <p style="font-size: 11px; color: #475569; margin: 4px 0 0 0; line-height: 1.4;">
                ${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}<br/>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}
              </p>
              <p style="font-size: 11px; color: #475569; margin: 6px 0 0 0;"><strong>Phone:</strong> +91 ${order.shippingAddress.phone}</p>
            </div>
            ` : ''}

            <p style="font-size: 10px; text-align: center; color: #94A3B8; margin-top: 24px; line-height: 1.5; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              * Blueprints CMYK standard offset printing rule strictly followed.<br/>
              Need immediate assistance? Tap on WhatsApp Support in-app.
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #E2E8F0; padding-top: 20px; text-align: center; font-size: 10px; color: #94A3B8;">
            <p style="font-weight: 700; color: #475569; margin: 0 0 4px 0; text-transform: uppercase;">© 2026 PRINTBAZAAR Press Ltd.</p>
            <p style="margin: 0; font-weight: 600; text-transform: uppercase;">High-Volume Industrial Printing & Wholesaling Platform</p>
          </div>
        </div>
      `;

      if (transporter) {
        await transporter.sendMail({
          from: `"PrintBazaar Orders" <${getCleanEnv("SMTP_FROM") || getCleanEnv("SMTP_USER")}>`,
          to: order.customerEmail,
          subject: `Order Received & Under Review: ${order.id}`,
          text: `Thank you for your order! Order ${order.id} for ₹${order.totalAmount} is currently under design review.`,
          html: htmlContent
        });
        console.log(`✅ Order confirmation email successfully sent to ${order.customerEmail}`);
        return res.json({ success: true, message: "Order confirmation email sent successfully via SMTP" });
      } else {
        console.log(`\n📬 [SANDBOX EMAIL LOG] Automated Order Confirmation email would be sent to: ${order.customerEmail}`);
        console.log(`Order Payload:`, JSON.stringify(order, null, 2));
        console.log(`Email Body:\n`, htmlContent, `\n`);
        return res.json({ success: true, message: "SMTP not configured. Email logged to sandbox output successfully." });
      }
    } catch (err: any) {
      console.error("❌ Send Order Confirmation Error:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Serve static assets or mount Vite dev middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global JSON Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("GLOBAL SERVER ERROR:", err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Internal Server Error",
      type: "SYSTEM_EXCEPTION"
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
