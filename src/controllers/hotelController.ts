import { Request, Response, NextFunction } from "express";
import {
    getHotels as serviceGetHotels,
    createHotel as serviceCreateHotel,
    updateHotel as serviceUpdateHotel,
} from "../services/hotelService";

/*
For getHotels:
    Default: return all hotels.
    Invalid search value (in case of id): return 400 Bad Request.
    Valid search with no matches: return an empty array.
*/

export async function getHotels (req: Request, res: Response, next: NextFunction) {
    const parsedId = req.query.id !== undefined ? Number(req.query.id) : undefined;

    if (parsedId !== undefined && Number.isNaN(parsedId)) {
        return res.status(400).json({ message: "id must be a number" });
    }

    const filters = {
        city: req.query.city as string | undefined,
        id: parsedId,
    };

    try {
        const hotels = await serviceGetHotels(filters);
        res.json(hotels);
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
    
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ message: "Request body must be a valid JSON object" });
    }
    
    const { name, city } = req.body;


    if (typeof name !== "string" || name.trim() === "" || typeof city !== "string" || city.trim() === "") {
        return res.status(400).json({ message: "name and city are required and must be non-empty strings" });
    }

    try {
        const hotel = await serviceCreateHotel(name.trim(), city.trim());
        res.status(201).json(hotel);
    } catch (error) {
        next(error);
    }
}

export async function updateHotel (req: Request, res: Response, next: NextFunction) {
    
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ message: "Request body must be a valid JSON object" });
    }
    
    const hotelId = Number(req.params.hotelId);

    if (Number.isNaN(hotelId)) {
        return res.status(400).json({ message: "id must be a number" });
    }

    const { name, city } = req.body; 

    if ((name === undefined && city === undefined) ||
        (name !== undefined && (typeof name !== "string" || name.trim() === "")) ||
        (city !== undefined && (typeof city !== "string" || city.trim() === ""))) {
        return res.status(400).json({ message: "At least one of name or city must be provided and must be non-empty strings" });
    }

    try {
        const hotel = await serviceUpdateHotel(hotelId, name?.trim(), city?.trim());
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        res.status(200).json(hotel);
    } catch (error) {
        next(error);
    }
}