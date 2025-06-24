import express from "express";
import {
  getUsers,
  login,
  signup,
  updateUser,
  logout,
} from "../controller/userController.js";

import { authMiddleware } from "../middlewares/auth.js";
const router = express.Router();

router.post("/update-user", authMiddleware, updateUser);
router.get("/users", authMiddleware, getUsers);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

export default router;