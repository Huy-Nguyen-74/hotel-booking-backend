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

export async function createHotel (req: Request, res: Response, next: NextFunction) {
    const { name, city } = req.body;

    try {
        const hotel = await serviceCreateHotel(name, city);
        res.status(201).json(hotel);
    } catch (error) {
        next(error);
    }
}

export async function updateHotel (req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "id must be a number" });
    }

    const { name, city } = req.body;

    try {
        const hotel = await serviceUpdateHotel(id, name, city);
        res.status(200).json(hotel);
    } catch (error) {
        next(error);
    }
}