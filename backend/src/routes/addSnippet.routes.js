import { addSnippetController } from "../controllers/addSnippet.controller.js";
import { Router } from "express";

const router = Router();

router.route("/add").post(addSnippetController);

export default router;
