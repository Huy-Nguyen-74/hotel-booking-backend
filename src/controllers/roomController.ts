import { Request, Response, NextFunction } from "express";

import {
    getRooms as serviceGetRooms,
    createRoom as serviceCreateRoom,
    updateRoom as serviceUpdateRoom,    
}  from "../services/roomService"; // Service module path.

/*
For getRooms: using optional filters (hotelId, roomId, type, price):
    - Default: return all rooms.
    - Invalid search value: return 400 Bad Request.
    - Valid search with no matches: return an empty array.
*/

export async function getRooms(req: Request, res: Response, next: NextFunction) {
    
    const parsedHotelId = req.query.hotelId !== undefined ? Number(req.query.hotelId) : undefined;
    const parsedRoomId = req.query.roomId !== undefined ? Number(req.query.roomId) : undefined;
    const parsedType = req.query.type !== undefined ? String(req.query.type) : undefined;
    const parsedPrice = req.query.price !== undefined ? Number(req.query.price) : undefined;

    if ((parsedHotelId !== undefined && Number.isNaN(parsedHotelId))){
        return res.status(400).json({ message: "hotelId must be a number" });
    }

    if ((parsedRoomId !== undefined && Number.isNaN(parsedRoomId))){
        return res.status(400).json({ message: "roomId must be a number" });
    }

    if ((parsedType !== undefined && typeof parsedType !== "string")){
        return res.status(400).json({ message: "type must be a string" });
    }

    if ((parsedPrice !== undefined && Number.isNaN(parsedPrice))) {
        return res.status(400).json({ message: "price must be a number" });
    }

    const filters = {
        hotelId: parsedHotelId,
        roomId: parsedRoomId,
        type: parsedType,
        price: parsedPrice,
    };

    try {
        const rooms = await serviceGetRooms(filters);
        res.json(rooms);
    } catch (error) {
        next(error);
    }
}


/*
For createRoom:
    - hotelId required
    - type required
    - price required
    - type must be a non-empty string after trim
    - price must be a positive number
*/


export async function createRoom(req: Request, res: Response, next: NextFunction) {
    
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ message: "Request body must be a valid JSON object" });
    }
    
    const { hotelId, type, price } = req.body;

    if (typeof hotelId !== "number" || Number.isNaN(hotelId))
        return res.status(400).json({ message: "hotelId must be a number" });

    if (typeof type !== "string" || type.trim() === "")
        return res.status(400).json({ message: "type is required and must be a non-empty string" });

    if (typeof price !== "number" || Number.isNaN(price) || price <= 0)
        return res.status(400).json({ message: "price is required and must be a positive number" });

    try {
        const room = await serviceCreateRoom(hotelId, type.trim(), price);
        res.status(201).json(room);
    } catch (error) {
        next(error);
    }
}


/*
For updateRoom:
    - roomId must be a valid number
    - at least one of type/price required
    - provided fields must be valid (type: non-empty string after trim, price: positive number)
    - if update returns null -> 404
*/



export async function updateRoom(req: Request, res: Response, next: NextFunction) {
    
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ message: "Request body must be a valid JSON object" });
    }
    
    const roomId = req.params.roomId ? Number(req.params.roomId) : undefined;
    const { type, price } = req.body;

    if (roomId === undefined || Number.isNaN(roomId)) {
        return res.status(400).json({ message: "roomId must be a number" });
    }

    if (type === undefined && price === undefined) {
        return res.status(400).json({ message: "At least one of type or price must be provided" });
    }

    if (type !== undefined && (typeof type !== "string" || type.trim() === "")) {
        return res.status(400).json({ message: "type must be a non-empty string" });
    }

    if (price !== undefined && (typeof price !== "number" || Number.isNaN(price) || price <= 0)) {
        return res.status(400).json({ message: "price must be a positive number" });
    }

    const trimmedType = typeof type === "string" ? type.trim() : undefined;

    try {
        const room = await serviceUpdateRoom(roomId, trimmedType, price);

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        res.json(room);

    } catch (error) {
        next(error);
    }
}   

