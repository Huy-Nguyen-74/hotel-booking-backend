import { Request, Response, NextFunction } from "express";

import {
    getRooms as serviceGetRooms,
    createRoom as serviceCreateRoom,
    updateRoom as serviceUpdateRoom,    
}  from "../services/roomService"; // Service module path.
import { AppError } from "../errors/AppError";

type RoomRow = {
    id: number;
    hotel_id: number;
    type: string;
    price: number;
};

function toRoomDto(room: RoomRow) {
    return {
        roomId: room.id,
        hotelId: room.hotel_id,
        type: room.type,
        price: room.price,
    };
}

/*
For getRooms: using optional filters (hotelId, roomId, type, price):
    - Default: return all rooms.
    - Invalid search value: return 400 Bad Request.
    - Valid search with no matches: return an empty array.
*/

export async function getRooms(req: Request, res: Response, next: NextFunction) {
    const rawHotelId = req.query.hotelId;
    const rawRoomId = req.query.roomId;
    const rawType = req.query.type;
    const rawPrice = req.query.price;

    if (rawHotelId !== undefined && typeof rawHotelId !== "string") {
        return next(new AppError("hotelId must be a number", 400));
    }

    if (rawRoomId !== undefined && typeof rawRoomId !== "string") {
        return next(new AppError("roomId must be a number", 400));
    }

    if (rawType !== undefined && typeof rawType !== "string") {
        return next(new AppError("type must be a string", 400));
    }

    if (rawPrice !== undefined && typeof rawPrice !== "string") {
        return next(new AppError("price must be a number", 400));
    }

    const parsedHotelId = rawHotelId !== undefined ? Number(rawHotelId) : undefined;
    const parsedRoomId = rawRoomId !== undefined ? Number(rawRoomId) : undefined;
    const parsedType = rawType;
    const parsedPrice = rawPrice !== undefined ? Number(rawPrice) : undefined;

    if ((parsedHotelId !== undefined && Number.isNaN(parsedHotelId))){
        return next(new AppError("hotelId must be a number", 400));
    }

    if ((parsedRoomId !== undefined && Number.isNaN(parsedRoomId))){
        return next(new AppError("roomId must be a number", 400));
    }

    if ((parsedPrice !== undefined && Number.isNaN(parsedPrice))) {
        return next(new AppError("price must be a number", 400));
    }

    const filters = {
        hotelId: parsedHotelId,
        roomId: parsedRoomId,
        type: parsedType,
        price: parsedPrice,
    };

    try {
        const rooms = await serviceGetRooms(filters);
        res.json((rooms as RoomRow[]).map(toRoomDto));
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
    if (!req.body || Array.isArray(req.body)) {
        return res.status(400).json({ success: false, message: "Request body must be a valid JSON object" });
    }
    
    const { hotelId, type, price } = req.body;

    if (hotelId === undefined) {
        return res.status(400).json({ success: false, message: "hotelId is required and must be a number" });
    }

    if (type === undefined) {
        return res.status(400).json({ success: false, message: "type is required and must be a non-empty string" });
    }

    if (price === undefined) {
        return res.status(400).json({ success: false, message: "price is required and must be a positive number" });
    }

    if (typeof hotelId !== "number" || Number.isNaN(hotelId))
        return res.status(400).json({ success: false, message: "hotelId is required and must be a number" });

    if (typeof type !== "string" || type.trim() === "")
        return res.status(400).json({ success: false, message: "type is required and must be a non-empty string" });

    if (typeof price !== "number" || Number.isNaN(price) || price <= 0)
        return res.status(400).json({ success: false, message: "price is required and must be a positive number" });

    try {
        const room = await serviceCreateRoom(hotelId, type.trim(), price);
        res.status(201).json(toRoomDto(room as RoomRow));
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
    const roomId = req.params.roomId ? Number(req.params.roomId) : undefined;

    if (roomId === undefined || Number.isNaN(roomId)) {
        return next(new AppError("roomId is required and must be a number", 400));
    }

    if (!req.body || Array.isArray(req.body)) {
        return next(new AppError("Request body must be a valid JSON object", 400));
    }

    const { type, price } = req.body;

    if (type === undefined && price === undefined) {
        return next(new AppError("At least one of type or price must be provided and must be valid", 400));
    }

    const invalidType = type !== undefined && (typeof type !== "string" || type.trim() === "");
    const invalidPrice = price !== undefined && (typeof price !== "number" || Number.isNaN(price) || price <= 0);

    if (invalidType) {
        return next(new AppError("type must be a non-empty string", 400));
    }

    if (invalidPrice) {
        return next(new AppError("price must be a positive number", 400));
    }

    const trimmedType = typeof type === "string" ? type.trim() : undefined;

    try {
        const room = await serviceUpdateRoom(roomId, trimmedType, price);

        if (!room) {
            return next(new AppError("Room not found", 404));
        }

        res.json(toRoomDto(room as RoomRow));

    } catch (error) {
        next(error);
    }
}   

