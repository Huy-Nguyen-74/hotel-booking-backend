import {
    findRooms,
    createRoom as repositoryCreateRoom,
    updateRoom as repositoryUpdateRoom
} from "../repositories/roomRepository"; // Repository module path.

export async function getRooms(filters: { hotelId?: number; roomId?: number; type?: string; price?: number }) {
    return await findRooms(filters);
}

export async function createRoom(hotelId: number, type: string, price: number) {
    return await repositoryCreateRoom(hotelId, type, price);
}

export async function updateRoom(roomId: number, type?: string, price?: number) {
    return await repositoryUpdateRoom(roomId, type, price);
}


