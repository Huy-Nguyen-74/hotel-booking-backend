import { HotelRow } from '../types/hotel';

export function toHotelDto(hotel: HotelRow) {
    return {
        hotelId: hotel.id,
        name: hotel.name,
        city: hotel.city
    };
}