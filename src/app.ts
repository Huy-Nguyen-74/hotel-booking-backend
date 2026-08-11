import "dotenv/config";
import express from "express";

import hotelRoutes from "./routes/hotelRoutes";
import roomRoutes from "./routes/roomRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import guestRoutes from "./routes/guestRoutes";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(express.json());

app.use("/", hotelRoutes);
app.use("/", roomRoutes);
app.use("/", bookingRoutes);
app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", guestRoutes);

app.use(errorHandler);
