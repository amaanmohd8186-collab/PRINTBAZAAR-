import { createExpressApp } from "../server";

// Startup / Diagnostics for Serverless environment
console.log("====================================================");
console.log("🚀 [VERCEL SERVERLESS] Init PrintBazaar Serverless Environment...");
console.log(`🚀 [VERCEL SERVERLESS] NODE_ENV = ${process.env.NODE_ENV}`);
console.log(`🚀 [VERCEL SERVERLESS] CASHFREE_ENVIRONMENT = ${process.env.CASHFREE_ENVIRONMENT}`);
console.log(`🚀 [VERCEL SERVERLESS] CASHFREE_CLIENT_ID Loaded = ${!!process.env.CASHFREE_CLIENT_ID}`);
console.log(`🚀 [VERCEL SERVERLESS] FIREBASE_PROJECT_ID = ${process.env.FIREBASE_PROJECT_ID}`);
console.log("====================================================");

const app = createExpressApp();

export default app;
