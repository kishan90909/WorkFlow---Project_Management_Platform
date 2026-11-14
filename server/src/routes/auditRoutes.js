import { Router } from "express";
import { listAuditLogs } from "../controllers/auditController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { ROLES } from "../constants/roles.js";

const router = Router();
router.use(authenticate, authorize(ROLES.ADMIN));
router.get("/", listAuditLogs);
export default router;
