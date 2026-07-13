import {
    findRooms,
    createRoom as repositoryCreateRoom,
    updateRoom as repositoryUpdateRoom
} from "../repositories/roomRepository"; // Repository module path.
import { AppError } from "../errors/AppError";

export async function getRooms(filters: { hotelId?: number; roomId?: number; type?: string; price?: number }) {
    return await findRooms(filters);
}

export async function createRoom(hotelId: number, type: string, price: number) {
    return await repositoryCreateRoom(hotelId, type, price);
}

export async function updateRoom(roomId: number, type?: string, price?: number) {
    
    const room = await findRooms({ roomId });
    if (!room || room.length === 0) {
        throw new AppError("Room not found", 404);
    }
    
    return await repositoryUpdateRoom(roomId, type, price);
}


