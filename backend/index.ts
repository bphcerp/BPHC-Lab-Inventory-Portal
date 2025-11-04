import express, { Request, Response } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user";
//import categoryRoutes from './routes/category';
import consumableCategoryRoutes from "./routes/consumableCategory";
import consumableRoutes from "./routes/consumable";
import vendorRoutes from "./routes/vendor";
import peopleRoutes from "./routes/people";
import outRoutes from "./routes/out";
import reportRoutes from "./routes/report";
import historyRoutes from "./routes/history";
import consumableDetailsRoutes from "./routes/consumableDetails";
import consumableTransactionRoutes from "./routes/consumableTransaction";
import transactionRoutes from "./routes/transactionsByPerson";
import vendorTransactions from "./routes/vendorTransactions";
import { authenticateToken, requireRole } from "./middleware/authenticateToken";

dotenv.config();

const app = express();

const { MONGO_HOST, MONGO_DB, MONGO_USER, MONGO_PASSWORD, SERVER_PORT } = process.env;

if (!MONGO_HOST || !MONGO_DB || !MONGO_USER || !MONGO_PASSWORD) {
  throw new Error(
    "Missing one or more required MongoDB environment variables: MONGO_HOST, MONGO_DB, MONGO_USER, MONGO_PASSWORD"
  );
}
// The MONGO_PORT environment variable is for the host machine to map to the container's 27017 port
const MONGO_URI = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:27017/${MONGO_DB}?authSource=admin&replicaSet=rs0`;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL!,
    credentials: true,
  })
);

// User routes - REMOVE the duplicate /api/user/me endpoint
// and just use the one from userRoutes
app.use("/api/user", userRoutes);

// Admin-specific routes
const adminRoutes = [
  { path: "/api/user/manage", middleware: requireRole(["admin"]) },
  { path: "/api/report/admin", middleware: requireRole(["admin"]) },
];

// Dashboard-specific routes
const dashboardRoutes = [
  {
    path: "/api/consumable/transaction",
    middleware: requireRole(["admin", "dashboard"]),
  },
  {
    path: "/api/transactions",
    middleware: requireRole(["admin", "dashboard"]),
  },
];

// Add role-specific middleware to routes that need it
adminRoutes.forEach((route) => {
  app.use(route.path, authenticateToken, route.middleware);
});

dashboardRoutes.forEach((route) => {
  app.use(route.path, authenticateToken, route.middleware);
});

//app.use('/api/category', categoryRoutes);
app.use("/api/consumable", consumableRoutes); // Main consumable routes
app.use("/api/consumable", outRoutes); // Mounting out routes at the same base URL as consumable
app.use("/api/vendor", vendorRoutes);
app.use("/api/category", consumableCategoryRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/vendorTransactions", vendorTransactions);
app.use("/api/people", peopleRoutes);
app.use("/api/consumable-details", consumableDetailsRoutes);
app.use("/api/consumable", consumableTransactionRoutes);
app.use(express.static("public"));

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to LAMBDA Inventory System API");
});

app.get("/api/check-auth", authenticateToken, (req: Request, res: Response) => {
  res.status(200).json({
    authenticated: true,
    message: "Authenticated successfully",
    user: req.user
      ? {
          name: req.user.name,
          role: req.user.role,
        }
      : null,
  });
});

app.listen(SERVER_PORT, () => {
  console.log(`Server is running on http://localhost:${SERVER_PORT}`);
});
