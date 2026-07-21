import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import {
    getHotels as serviceGetHotels,
    createHotel as serviceCreateHotel,
    updateHotel as serviceUpdateHotel,
} from "../services/hotelService";
import { toHotelDto } from "../DTO/hotelDto";

/*
For getHotels:
    Default: return all hotels.
    Invalid search value (in case of id): return 400 Bad Request.
    Valid search with no matches: return an empty array.
*/

export async function getHotels (req: Request, res: Response, next: NextFunction) {
    
    const rawId = req.query.hotelId;
    const rawName = req.query.name;
    const rawCity = req.query.city;
    
    if (rawId !== undefined && typeof rawId !== "string") {
        return next(new AppError("hotelId must be a single value", 400));
    }

    if (rawName !== undefined && typeof rawName !== "string") {
        return next(new AppError("name must be a string", 400));
    }

    if (rawCity !== undefined && typeof rawCity !== "string") {
        return next(new AppError("city must be a string", 400));
    }

    const parsedId = rawId !== undefined ? Number(rawId) : undefined;
    const parsedName = rawName !== undefined ? rawName.trim() : undefined;
    const parsedCity = rawCity !== undefined ? rawCity.trim() : undefined;

    if (parsedId !== undefined && (Number.isNaN(parsedId) || !Number.isInteger(parsedId) || parsedId <= 0)) {
        return next(new AppError("hotelId must be a positive integer", 400));
    }

    if (parsedName !== undefined && parsedName === "") {
        return next(new AppError("name must be a non-empty string", 400));
    }

    if (parsedCity !== undefined && parsedCity === "") {
        return next(new AppError("city must be a non-empty string", 400));
    }

    const filters = {
        hotelId: parsedId,
        name: parsedName,
        city: parsedCity,
    };

    try {
        const hotels = await serviceGetHotels(filters);
        res.json(hotels.map(toHotelDto));
    } catch (error) {
        next(error);
    }   
}

/*
For createHotel:
    - name required
    - city required
    - both must be non-empty strings after trim

For updateHotel:
    - id must be valid number
    - at least one of name/city required
    - provided fields must be non-empty strings after trim
    - if update returns null -> 404
*/

export async function createHotel (req: Request, res: Response, next: NextFunction) {
    if (!req.body || Array.isArray(req.body)) {
        return next(new AppError("Request body must be a valid JSON object", 400));
    }
    
    const { name, city } = req.body;

    if (name === undefined || city === undefined) {
        return next(new AppError("name and city are required fields", 400));
    }

    if (typeof name !== "string" || name.trim() === "" || typeof city !== "string" || city.trim() === "") {
        return next(new AppError("name and city are required and must be non-empty strings", 400));
    }

    try {
        const hotel = await serviceCreateHotel(name.trim(), city.trim());
        res.status(201).json(toHotelDto(hotel));
    } catch (error) {
        next(error);
    }
}

export async function updateHotel (req: Request, res: Response, next: NextFunction) {
    const hotelId = Number(req.params.hotelId);

    if (!hotelId || Number.isNaN(hotelId)) {
        return next(new AppError("hotelId is required and must be a number", 400));
    }

    if (!req.body || Array.isArray(req.body)) {
        return next(new AppError("Request body must be a valid JSON object", 400));
    }

    const { name, city } = req.body; 

    if ((name === undefined && city === undefined) ||
        (name !== undefined && (typeof name !== "string" || name.trim() === "")) ||
        (city !== undefined && (typeof city !== "string" || city.trim() === ""))) {
        return next(new AppError("At least one of name or city must be provided and must be non-empty strings", 400));
    }

    try {
        const hotel = await serviceUpdateHotel(hotelId, name?.trim(), city?.trim());
        res.status(200).json(toHotelDto(hotel));
    } catch (error) {
        next(error);
    }
}