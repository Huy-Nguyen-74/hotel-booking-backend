import { Router } from "express";
import {
  createUser,
  deactivateUserById,
  getSelfInfo,
  getUsers,
  updateSelfInfo,
  updateUserInfo,
} from "../controllers/userController";
import { authenticateToken } from "../middleware/authenticateMiddleware";
import { authorizeRoles } from "../middleware/authorizeMiddleware";

const router = Router();

router.post("/users", authenticateToken, authorizeRoles("admin"), createUser);
router.get("/users", authenticateToken, authorizeRoles("admin"), getUsers);
router.get("/users/me", authenticateToken, authorizeRoles("admin", "staff"), getSelfInfo);
router.patch("/users/me", authenticateToken, authorizeRoles("admin", "staff"), updateSelfInfo);
router.patch("/users/:id/deactivate", authenticateToken, authorizeRoles("admin"), deactivateUserById);
router.patch("/users/:id", authenticateToken, authorizeRoles("admin"), updateUserInfo);

export default router;
