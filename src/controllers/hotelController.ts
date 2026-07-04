import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import {
  getAllRooms,
  getAllHotels,
  getHotelById,
  getHotelsByCity,
  getRoomsByHotelId,
} from "../services/hotelService";

export async function listHotels(req: Request, res: Response, next: NextFunction) {
  try {
    const hotels = await getAllHotels();
    res.json(hotels);
  } catch (error) {
    next(error);
  }
}

export async function listRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const rooms = await getAllRooms();
    res.json(rooms);
  } catch (error) {
    next(error);
  }
}

export async function getHotel(req: Request, res: Response, next: NextFunction) {
  try {
    const hotelId = Number(req.params.id);
    const hotel = await getHotelById(hotelId);

    if (!hotel) {
      throw new AppError("Hotel not found", 404);
    }

    res.json(hotel);
  } catch (error) {
    next(error);
  }
}

export async function listHotelsByCity(req: Request, res: Response, next: NextFunction) {
  try {
    const city = String(req.params.city);
    const hotels = await getHotelsByCity(city);
    res.json(hotels);
  } catch (error) {
    next(error);
  }
}

export async function listRoomsByHotel(req: Request, res: Response, next: NextFunction) {
  try {
    const hotelId = Number(req.params.id);
    const rooms = await getRoomsByHotelId(hotelId);
    res.json(rooms);
  } catch (error) {
    next(error);
  }
}