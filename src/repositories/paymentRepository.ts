import { CreatePaymentInput, PaymentRow } from "../types/payment";
import pool from "../database/db";

export async function createPayment(input: CreatePaymentInput): Promise<PaymentRow> {
  const { bookingId, stripePaymentIntentId, amount, currency, status } = input;
  const query = `
    INSERT INTO payments (booking_id, stripe_payment_intent_id, amount, currency, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [bookingId, stripePaymentIntentId, amount, currency, status];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function getPaymentById(id: number): Promise<PaymentRow | null> {
    const query = `
      SELECT * FROM payments WHERE id = $1;
    `;
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
}

export async function getPaymentByStripePaymentIntentId(
  stripePaymentIntentId: string
): Promise<PaymentRow | null> {
  const query = `
    SELECT *
    FROM payments
    WHERE stripe_payment_intent_id = $1;
  `;
  const result = await pool.query(query, [stripePaymentIntentId]);
  return result.rows[0] || null;
}

export async function getLatestPaymentByBookingId(bookingId: number): Promise<PaymentRow | null> {
  const query = `
    SELECT *
    FROM payments
    WHERE booking_id = $1
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const result = await pool.query(query, [bookingId]);
  return result.rows[0] || null;
}

