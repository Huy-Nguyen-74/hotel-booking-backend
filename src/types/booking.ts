export interface BookingRow {
  id: number;
  hotel_id: number;
  room_id: number;
  guest_name: string;
  guest_user_id?: number;
  created_by_user_id: number;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  total_price: number;
}

export type CreateBookingInput = {
  hotelId: number;
  roomId: number;
  guestName: string;
  guestUserId?: number;
  createdByUserId: number;
  checkInDate: string;
  checkOutDate: string;
};


