import { createExpressApp } from "../server";
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
