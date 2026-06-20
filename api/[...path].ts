import { createExpressApp } from "../server";
import { logCashfreeDiagnostics, validateEnvironment } from "./diagnostics";

// Pre-initialization environment check for Serverless
try {
  logCashfreeDiagnostics();
  validateEnvironment();
  console.log("✅ [VERCEL SERVERLESS] Environment validation successful.");
} catch (err: any) {
  console.warn("⚠️ [VERCEL SERVERLESS] ENVIRONMENT VALIDATION WARNING:");
  console.warn(err.message);
  console.warn("The server will start successfully, but payment endpoints will fail until credentials are set.");
}

const app = createExpressApp();

// Vercel Serverless specific error handling to guarantee JSON responses
app.use((err: any, req: any, res: any, next: any) => {
  console.error("🔥 [VERCEL SERVERLESS FATAL]:", err);
  res.status(500).json({
    success: false,
    error: "SERVERLESS_EXECUTION_ERROR",
    message: err.message || "An unexpected error occurred in the serverless handler.",
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;
