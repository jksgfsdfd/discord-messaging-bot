import express from 'express';
import {VerifyDiscordRequest} from "../utils.js";
import {default as interactionsController} from "../controllers/interactions.js";
const router = express.Router();

router.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

router.route("/").post(interactionsController);

export default router;