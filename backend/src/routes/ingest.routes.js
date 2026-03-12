import { Router } from "express";
import { ingestController } from "../controllers/ingest.controller.js";

const router = Router();

router.route("/").post(ingestController);

export default router;
