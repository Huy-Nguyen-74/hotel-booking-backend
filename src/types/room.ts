export type RoomRow = {
    id: number;
    hotel_id: number;
    type: string;
    price: number;
    capacity: number;
};

export type RoomSearchFilters = {
  hotelId?: number;
  type?: string;
  capacity?: number;
  minPrice?: number;
  maxPrice?: number;
  checkInDate?: string;
  checkOutDate?: string;
}
