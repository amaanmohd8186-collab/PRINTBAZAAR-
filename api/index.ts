import { createExpressApp } from "../server";
import { logCashfreeDiagnostics, validateEnvironment } from "./diagnostics";

// Pre-initialization environment check for Serverless
try {
  logCashfreeDiagnostics();
  validateEnvironment();
  console.log("✅ [VERCEL SERVERLESS] Environment validation successful.");
} catch (err: any) {
  console.error("🔥 [VERCEL SERVERLESS] ENVIRONMENT VALIDATION FAILED:");
  console.error(err.message);
  // We don't throw here to allow the app to boot, but handlers will fail gracefully
  // Or actually, the user said "throw an immediate server-side error if any are missing"
  // However, throwing at module level in Vercel might crash the entire instance.
  // I will throw to satisfy the "immediate server-side error" requirement.
  throw err;
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
