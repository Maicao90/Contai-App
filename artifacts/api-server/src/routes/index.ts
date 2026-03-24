import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leadsRouter from "./leads";
import campaignsRouter from "./campaigns";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(campaignsRouter);
router.use(leadsRouter);

export default router;
