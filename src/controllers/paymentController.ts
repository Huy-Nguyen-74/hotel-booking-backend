import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { createPaymentForGuest as serviceCreatePaymentForGuest } from "../services/paymentService";
import { toPaymentDto } from "../DTO/paymentDto";


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
        const { payment, clientSecret } = await serviceCreatePaymentForGuest(bookingId, guestUserId);
        res.status(201).json({ payment: toPaymentDto(payment), clientSecret });
    } catch (error) {
        next(error);
    }
}

