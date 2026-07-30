import { BookingRow } from '../types/booking';

export function toBookingDto(booking: BookingRow) {
  return {
    bookingId: booking.id,
    hotelId: booking.hotel_id,
    roomId: booking.room_id,
    guestName: booking.guest_name,
    guestUserId: booking.guest_user_id,
    createdByUserId: booking.created_by_user_id,
    checkInDate: booking.check_in_date,
    checkOutDate: booking.check_out_date,
    nights: booking.nights,
    totalPrice: booking.total_price,
  };
}

