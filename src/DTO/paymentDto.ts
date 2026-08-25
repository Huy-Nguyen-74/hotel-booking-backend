import { PaymentRow } from "../types/payment";

export function toPaymentDto(payment: PaymentRow) {
  return {
    paymentId: payment.id,
    bookingId: payment.booking_id,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
  };
}

