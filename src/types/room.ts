export type RoomRow = {
    id: number;
    hotel_id: number;
    type: string;
    price: number;
    capacity: number;
};

export type RoomSearchFilters = {
  hotelId?: number;
  city?: string;
  type?: string;
  guestCount?: number;
  minPrice?: number;
  maxPrice?: number;
  checkInDate?: string;
  checkOutDate?: string;
}

export type JoinRoomHotelRow = {
  id: number;
  hotel_id: number;
  hotel_name: string;
  city: string;
  type: string;
  price: number;
  capacity: number;
}
