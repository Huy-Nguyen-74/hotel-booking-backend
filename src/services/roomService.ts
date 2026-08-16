import {
    findAvailableRooms,
    findRooms,
    createRoom as repositoryCreateRoom,
    updateRoom as repositoryUpdateRoom
} from "../repositories/roomRepository"; // Repository module path.
import { findHotels } from "../repositories/hotelRepository";
import { AppError } from "../errors/AppError";

// Get rooms is restricted to admin and staff, while search available rooms is open to guests and public users.
export async function getRooms(filters: { hotelId?: number; roomId?: number; type?: string; price?: number }) {
    return await findRooms(filters);
}

export async function searchAvailableRooms(filters: {
  hotelId?: number;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  checkInDate?: string;
  checkOutDate?: string;
}) {

  /*
  Validation for checkInDate and checkOutDate:
  -If either checkInDate or checkOutDate is provided, both must be provided.
  -If neither is provided, it's okay.
  */

  if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
    throw new AppError("minPrice cannot be greater than maxPrice", 400);
  }

  if ((filters.checkInDate !== undefined && filters.checkOutDate === undefined) || (filters.checkInDate === undefined && filters.checkOutDate !== undefined)) {
    throw new AppError("Both checkInDate and checkOutDate must be provided together", 400);
  }

  if (filters.checkInDate && filters.checkOutDate && new Date(filters.checkInDate) >= new Date(filters.checkOutDate)) {
    throw new AppError("checkInDate must be before checkOutDate", 400);
  }
  
  const availableRooms = await findAvailableRooms(filters);
  return availableRooms;
}
    

export async function createRoom(hotelId: number, type: string, price: number) {
    const hotel = await findHotels({ hotelId });
    if (!hotel || hotel.length === 0) {
        throw new AppError("Hotel not found", 404);
    }

    return await repositoryCreateRoom(hotelId, type, price);
}

export async function updateRoom(roomId: number, type?: string, price?: number) {
    
    const room = await findRooms({ roomId });
    if (!room || room.length === 0) {
        throw new AppError("Room not found", 404);
    }
    
    return await repositoryUpdateRoom(roomId, type, price);
}


