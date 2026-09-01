import "dotenv/config";
import express from "express";

import hotelRoutes from "./routes/hotelRoutes";
import roomRoutes from "./routes/roomRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import guestRoutes from "./routes/guestRoutes";
import { errorHandler } from "./middleware/errorHandler";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi";
import paymentRoutes from "./routes/paymentRoutes";
import { stripeWebhookController } from "./controllers/paymentController";

export const app = express();

app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookController
);

app.use(express.json());

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument)
);

app.use("/", hotelRoutes);
app.use("/", roomRoutes);
app.use("/", bookingRoutes);
app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", guestRoutes);
app.use("/", paymentRoutes);

app.use(errorHandler);
