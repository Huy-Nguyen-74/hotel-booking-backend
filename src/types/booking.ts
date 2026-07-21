export interface BookingRow {
  id: number;
  hotel_id: number;
  room_id: number;
  guest_name: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  total_price: number;
}

