import { Cashfree, CFEnvironment } from "cashfree-pg";
const cf = new (Cashfree as any)(CFEnvironment.SANDBOX, "123", "456");
console.log(typeof cf.PGCreateOrder);
