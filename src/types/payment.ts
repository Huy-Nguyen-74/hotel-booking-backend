export type PaymentRow = {
  id: number;
  booking_id: number;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed";
  created_at: string;
  updated_at: string;
}

export type CreatePaymentInput = {
  bookingId: number;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed";
}
