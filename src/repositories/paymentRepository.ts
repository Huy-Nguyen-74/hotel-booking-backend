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

// Function to get a payment by one of its unique identifier (id or stripe_payment_intent_id) or booking_id (needs to be the latest payment for that booking)
export async function getPayment(id?: number, stripePaymentIntentId?: string, bookingId?: number): Promise<PaymentRow | null> {
    let query = '';
    let values = [];
    if (id) {
        query = 'SELECT * FROM payments WHERE id = $1;';
        values = [id];
    } else if (stripePaymentIntentId) {
        query = 'SELECT * FROM payments WHERE stripe_payment_intent_id = $1;';
        values = [stripePaymentIntentId];
    } else if (bookingId) {
        query = 'SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1;';
        values = [bookingId];
    } else {
        return null;
    }
    const result = await pool.query(query, values);
    return result.rows[0] || null;
}

// Function to update the status of a payment by its unique identifier (id or stripe_payment_intent_id) or booking_id (needs to be the latest payment for that booking)
export async function updatePaymentStatus(status: "pending" | "succeeded" | "failed", id?: number, stripePaymentIntentId?: string, bookingId?: number): Promise<PaymentRow | null> {
    let query = '';
    let values: (number | string)[] = [];
    if (id) {
        query = `
            UPDATE payments
            SET status = $2
            WHERE id = $1
            RETURNING *;
        `;
        values = [id, status];
    } else if (stripePaymentIntentId) {
        query = `
            UPDATE payments
            SET status = $2
            WHERE stripe_payment_intent_id = $1
            RETURNING *;
        `;
        values = [stripePaymentIntentId, status];
    } else if (bookingId) {
        query = `
            UPDATE payments
            SET status = $2
            WHERE id = (
                SELECT id FROM payments
                WHERE booking_id = $1
                ORDER BY created_at DESC
                LIMIT 1
            )
            RETURNING *;
        `;
        values = [bookingId, status];
    } else {
        return null;
    }
    const result = await pool.query(query, values);
    return result.rows[0];
}


