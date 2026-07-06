import { Router } from "express";

import {
    getRooms,
    createRoom,
    updateRoom,
} from "../controllers/roomController";

const router = Router();

router.get("/rooms", getRooms);
router.post("/rooms", createRoom);
router.patch("/rooms/:roomId", updateRoom);

export default router;