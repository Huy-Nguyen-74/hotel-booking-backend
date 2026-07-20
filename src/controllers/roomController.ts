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
    if (req.query !== undefined && Array.isArray(req.query)) {
        return next(new AppError("Query parameters must be a valid JSON object", 400));
    }
    
    const rawHotelId = req.query.hotelId;
    const rawRoomId = req.query.roomId;
    const rawType = req.query.type;
    const rawPrice = req.query.price;

    if (rawHotelId !== undefined && (typeof rawHotelId !== "string" || rawHotelId.trim() === "")) {
        return next(new AppError("hotelId must be a number", 400));
    }

    if (rawRoomId !== undefined && (typeof rawRoomId !== "string" || rawRoomId.trim() === "")) {
        return next(new AppError("roomId must be a number", 400));
    }

    if (rawType !== undefined && (typeof rawType !== "string" || rawType.trim() === "")) {
        return next(new AppError("type must be a non-empty string", 400));
    }

    if (rawPrice !== undefined && (typeof rawPrice !== "string" || rawPrice.trim() === "")) {
        return next(new AppError("price must be a number", 400));
    }

    const parsedHotelId = rawHotelId !== undefined ? Number(rawHotelId.trim()) : undefined;
    const parsedRoomId = rawRoomId !== undefined ? Number(rawRoomId.trim()) : undefined;
    const parsedType = rawType !== undefined ? rawType.trim() : undefined;
    const parsedPrice = rawPrice !== undefined ? Number(rawPrice.trim()) : undefined;

    // Validate canonical values: hotelId and roomId must be positive integers, price must be a positive number.

    if (parsedHotelId !== undefined && (!Number.isInteger(parsedHotelId) || parsedHotelId <= 0)) {
        return next(new AppError("hotelId must be a positive integer", 400));
    }

    if (parsedRoomId !== undefined && (!Number.isInteger(parsedRoomId) || parsedRoomId <= 0)) {
        return next(new AppError("roomId must be a positive integer", 400));
    }

    if (parsedPrice !== undefined && (Number.isNaN(parsedPrice) || parsedPrice <= 0)) {
        return next(new AppError("price must be a positive number", 400));
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
        return next(new AppError("Request body must be a valid JSON object", 400));
    }
    
    const { hotelId, type, price } = req.body;

    // Validate required fields

    if (hotelId === undefined) {
        return next(new AppError("hotelId is required", 400));
    }

    if (type === undefined) {
        return next(new AppError("type is required", 400));
    }

    if (price === undefined) {
        return next(new AppError("price is required", 400));
    }

    // Validate field types and values

    if (typeof hotelId !== "number" || Number.isNaN(hotelId) || Number.isInteger(hotelId) === false || hotelId <= 0)
        return next(new AppError("hotelId must be a number", 400));

    if (typeof type !== "string" || type.trim() === "")
        return next(new AppError("type must be a non-empty string", 400));

    if (typeof price !== "number" || Number.isNaN(price) || price <= 0)
        return next(new AppError("price must be a positive number", 400));

    const passedHotelId = hotelId;
    const passedType = type.trim();
    const passedPrice = price;

    try {
        const room = await serviceCreateRoom(passedHotelId, passedType, passedPrice);
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
    if (!req.params || Array.isArray(req.params)) {
        return next(new AppError("Request parameters must be a valid JSON object", 400));
    }
    
    const roomId = req.params.roomId;

    if (roomId === undefined || typeof roomId !== "string" || roomId.trim() === "") {
        return next(new AppError("roomId is required and must be a valid number", 400));
    }

    const parsedRoomId = Number(roomId.trim());

    if (Number.isNaN(parsedRoomId) || !Number.isInteger(parsedRoomId) || parsedRoomId <= 0) {
        return next(new AppError("roomId must be a positive integer", 400));
    }

    if (!req.body || Array.isArray(req.body)) {
        return next(new AppError("Request body must be a valid JSON object", 400));
    }

    const type = req.body.type;
    const price = req.body.price;

    if (type === undefined && price === undefined) {
        return next(new AppError("At least one of type or price must be provided", 400));
    }

    if (type !== undefined && (typeof type !== "string" || type.trim() === "")) {
        return next(new AppError("type must be a non-empty string", 400));
    }

    if (price !== undefined && (typeof price !== "number" || Number.isNaN(price) || price <= 0)) {
        return next(new AppError("price must be a positive number", 400));
    }

    try {
        const room = await serviceUpdateRoom(parsedRoomId, type?.trim(), price);

        if (!room) {
            return next(new AppError("Room not found", 404));
        }

        res.json(toRoomDto(room as RoomRow));

    } catch (error) {
        next(error);
    }
}   

