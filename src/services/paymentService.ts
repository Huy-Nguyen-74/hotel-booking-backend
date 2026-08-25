import { stripe } from "../integrations/stripe";
import { createPayment } from "../repositories/paymentRepository";
import { AppError } from "../errors/AppError";
import { guestViewOneSpecificBooking } from "./guestService";

function mapStripeStatus(
  stripeStatus: string
): "pending" | "succeeded" | "failed" {
  if (stripeStatus === "succeeded") {
    return "succeeded";
  }

  if (stripeStatus === "canceled") {
    return "failed";
  }

  return "pending";
}

export async function createPaymentForGuest(
  bookingId: number,
  guestUserId: number
) {
  // 1. Load only a booking owned by this guest
  const booking = await guestViewOneSpecificBooking(guestUserId, bookingId);

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // 2. Don't allow payment for a cancelled booking
  if (booking.status === "cancelled") {
    throw new AppError("Cannot pay for a cancelled booking", 400);
  }

  // 3. Stripe creates the payment process
  // Amount comes from OUR booking, never from the client
  const paymentIntent = await stripe.paymentIntents.create({
    amount: booking.total_price,
    currency: "jpy",
    metadata: {
      bookingId: String(booking.id),
      guestUserId: String(guestUserId),
    },
  });

  // 4. Translate Stripe's state into our simpler state model
  const status = mapStripeStatus(paymentIntent.status);

  // 5. Save Stripe's payment in our PostgreSQL database
  const payment = await createPayment({
    bookingId: booking.id,
    stripePaymentIntentId: paymentIntent.id,
    amount: booking.total_price,
    currency: "JPY",
    status,
  });

  // 6. Controller will return this to the frontend
  return {
    payment,
    clientSecret: paymentIntent.client_secret,
  };
}