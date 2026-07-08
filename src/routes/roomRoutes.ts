import { Router } from "express";

import {
    getRooms,
    createRoom,
    updateRoom,
} from "../controllers/roomController";

import { authenticateToken } from "../middleware/authenticateMiddleware";
import { authorizeRoles } from "../middleware/authorizeMiddleware";

const router = Router();

router.get("/rooms", authenticateToken, authorizeRoles("admin", "staff"), getRooms);
router.post("/rooms", authenticateToken, authorizeRoles("admin"), createRoom);
router.patch("/rooms/:roomId", authenticateToken, authorizeRoles("admin"), updateRoom);

export default router;