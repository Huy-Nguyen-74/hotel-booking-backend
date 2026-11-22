import { RoomRow } from "../types/room";
import { JoinRoomHotelRow } from "../types/room";

export function toRoomDto(room: RoomRow) {
    return {
        roomId: room.id,
        hotelId: room.hotel_id,
        type: room.type,
        price: room.price,
        capacity: room.capacity,
    };
}

export function toJoinRoomHotelDto(room: JoinRoomHotelRow) {
    return {
        roomId: room.id,
        hotelId: room.hotel_id,
        hotelName: room.hotel_name,
        city: room.city,
        type: room.type,
        price: room.price,
        capacity: room.capacity,
    };
}