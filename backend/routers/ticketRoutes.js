import express from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { createTicket, getTicket, getTickets } from "../controller/ticketController.js";

const router = express.Router();

router.get("/", authMiddleware, getTickets);
router.get("/:id", authMiddleware, getTicket);
router.post("/", authMiddleware, createTicket);

export default router;