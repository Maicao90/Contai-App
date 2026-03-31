import { Router } from "express";
import { databaseLocation, databaseProvider } from "@workspace/db";

const router = Router();

router.get("/healthz", (_req, res) => {
  res.json({
    status: "ok",
    service: "contai-api",
    databaseProvider,
    databaseLocation,
  });
});

export default router;
