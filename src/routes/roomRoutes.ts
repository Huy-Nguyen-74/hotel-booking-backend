import { Router } from "express";

import {
    getRooms,
    createRoom,
    updateRoom,
} from "../controllers/roomController";

import { authenticateToken } from "../middleware/authenticateMiddleware";
import { authorizeRoles } from "../middleware/authorizeMiddleware";
import { searchAvailableRooms } from "../controllers/roomController";

const router = Router();

router.get("/rooms", authenticateToken, authorizeRoles("admin", "staff"), getRooms);
router.get("/available-rooms", searchAvailableRooms);
router.post("/rooms", authenticateToken, authorizeRoles("admin"), createRoom);
router.patch("/rooms/:roomId", authenticateToken, authorizeRoles("admin"), updateRoom);

export default router;