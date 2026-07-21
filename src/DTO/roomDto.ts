import { RoomRow } from "../types/room";

export function toRoomDto(room: RoomRow) {
    return {
        roomId: room.id,
        hotelId: room.hotel_id,
        type: room.type,
        price: room.price,
    };
}
