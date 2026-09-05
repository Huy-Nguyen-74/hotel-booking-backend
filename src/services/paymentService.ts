import { stripe } from "../integrations/stripe";
import Stripe from "stripe";
import {
  createPayment,
  getPayment,
  updatePaymentStatus,
} from "../repositories/paymentRepository";
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
  // 1. Load a booking owned by the authenticated guest
  const booking = await guestViewOneSpecificBooking(
    guestUserId,
    bookingId
  );

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // 2. Reject payment for a cancelled booking
  if (booking.status === "cancelled") {
    throw new AppError(
      "Cannot pay for a cancelled booking",
      400
    );
  }

  // 3. Check the booking's latest payment attempt
  const existingPayment =
    await getPayment(undefined, undefined, booking.id);

  // 4. Do not allow another payment after success
  if (
    existingPayment &&
    existingPayment.status === "succeeded"
  ) {
    throw new AppError(
      "Booking has already been paid for",
      400
    );
  }

  // 5. If payment is still pending, reuse the same Stripe PaymentIntent
  if (
    existingPayment &&
    existingPayment.status === "pending"
  ) {
    const existingPaymentIntent =
      await stripe.paymentIntents.retrieve(
        existingPayment.stripe_payment_intent_id
      );
    
    if (!existingPaymentIntent.client_secret) {
      throw new AppError(
        "Failed to retrieve Stripe PaymentIntent client secret",
        500
      );
    }

    return {
      payment: existingPayment,
      clientSecret: existingPaymentIntent.client_secret,
      isReused: true,
    };
  }

  // 6. No previous payment, or previous attempt failed:

  // Use an idempotency key to ensure that if the user clicks "Pay" multiple times, we don't create multiple Stripe PaymentIntents
  const idempotencyKey = existingPayment
  ? `booking-${booking.id}-after-failed-${existingPayment.id}`
  : `booking-${booking.id}-initial`;

  // create a new Stripe PaymentIntent using our trusted booking amount
  const newPaymentIntent =
    await stripe.paymentIntents.create({
      amount: booking.total_price,
      currency: "jpy",
      metadata: {
        bookingId: String(booking.id),
        guestUserId: String(guestUserId),
      },
    }, {
      idempotencyKey,
    });

  if (!newPaymentIntent.client_secret) {
    throw new AppError(
      "Failed to create Stripe PaymentIntent",
      500
    );
  }

  // 7. Translate Stripe's status into our simpler payment status
  const status = mapStripeStatus(
    newPaymentIntent.status
  );

  // 8. Persist the new payment attempt in PostgreSQL
  const payment = await createPayment({
    bookingId: booking.id,
    stripePaymentIntentId: newPaymentIntent.id,
    amount: booking.total_price,
    currency: "JPY",
    status,
  });

  // 9. Return our payment record plus the clientSecret
  // that the frontend uses to continue the Stripe payment
  return {
    payment,
    clientSecret: newPaymentIntent.client_secret,
    isReused: false,
  };
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
    const stripePaymentIntentId = event.data.object.id;
    const newStatus = event.type === "payment_intent.succeeded" ? "succeeded" : "failed";

    const checkExistingPayment = await getPayment(undefined, stripePaymentIntentId);

    if (!checkExistingPayment) {
      throw new AppError("Payment not found for the given Stripe PaymentIntent ID", 404);
    }
    await updatePaymentStatus(newStatus, undefined, stripePaymentIntentId, undefined);
  }
}

