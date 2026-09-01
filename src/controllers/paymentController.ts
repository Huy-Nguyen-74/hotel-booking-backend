import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { createPaymentForGuest as serviceCreatePaymentForGuest } from "../services/paymentService";
import { toPaymentDto } from "../DTO/paymentDto";
import { stripe } from "../integrations/stripe";
import { handleStripeWebhookEvent } from "../services/paymentService";


export async function createPaymentForGuest(req: Request, res: Response, next: NextFunction) {
    if (!req.user || req.user.role !== "guest" || !req.user.id) {
        return next(new AppError("Unauthorized", 401));
    }

    if (!req.params.bookingId || isNaN(Number(req.params.bookingId))) {
        return next(new AppError("Booking ID must be a number", 400));
    }

    const bookingId = Number(req.params.bookingId);
    const guestUserId = req.user.id;

    if (bookingId <= 0 || !Number.isInteger(bookingId)) {
        return next(new AppError("Booking ID must be a positive integer", 400));
    }

    if (guestUserId <= 0 || !Number.isInteger(guestUserId)) {
        return next(new AppError("Guest User ID must be a positive integer", 400));
    }

    try {
        const { payment, clientSecret, isReused } = await serviceCreatePaymentForGuest(bookingId, guestUserId);
        res.status(isReused ? 200 : 201).json({ payment: toPaymentDto(payment), clientSecret });
    } catch (error) {
        next(error);
    }
}

export async function stripeWebhookController(req: Request, res: Response, next: NextFunction) {
  const signature = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature as string,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return next(new AppError("Invalid webhook signature", 400));
  }
  await handleStripeWebhookEvent(event);
  return res.status(200).json({ received: true });
}




