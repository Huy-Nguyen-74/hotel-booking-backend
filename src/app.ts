import express from "express";

import hotelRoutes from "./routes/hotelRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import roomRoutes from "./routes/roomRoutes";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(express.json());

app.use("/", hotelRoutes);
app.use("/", bookingRoutes);
app.use("/", roomRoutes);

app.use(errorHandler);
