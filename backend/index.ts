import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user';
//import categoryRoutes from './routes/category';
import consumableCategoryRoutes from './routes/consumableCategory';
import consumableRoutes from './routes/consumable';
import vendorRoutes from './routes/vendor';
import peopleRoutes from './routes/people';
import outRoutes from './routes/out';
import reportRoutes from './routes/report';
import historyRoutes from './routes/history';
import consumableDetailsRoutes from './routes/consumableDetails';
import transactionRoutes from './routes/transactionsByPerson';
import vendorTransactions from './routes/vendorTransactions'
import { authenticateToken } from './middleware/authenticateToken';

dotenv.config();

const app = express();
const PORT = process.env.PORT!;
const url = 'https://bits-inventorymanagement-backend.onrender.com';
const interval = 30000;

mongoose.connect(process.env.DB_URI!)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL!,
  credentials: true
}));

app.use('/api/user', userRoutes);
//app.use('/api/category', categoryRoutes);
app.use('/api/consumable', consumableRoutes); // Main consumable routes
app.use('/api/consumable', outRoutes); // Mounting out routes at the same base URL as consumable
app.use('/api/vendor', vendorRoutes);
app.use('/api/category', consumableCategoryRoutes);
app.use('/api/history',historyRoutes);
app.use('/api/report',reportRoutes);
app.use('/api/transactions',transactionRoutes);
app.use('/api/vendorTransactions', vendorTransactions);
app.use('/api/people',peopleRoutes);
app.use('/api/consumable-details', consumableDetailsRoutes);
app.use(express.static("public"));

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to LAMBDA Inventory System API');
});

app.get('/api/check-auth', authenticateToken, (req: Request, res: Response) => {
  res.send('Welcome to LAMBDA Inventory System API (Authenticated)');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


function keepAlive() {
  fetch(url)
    .then((response) => {
      console.log(`Pinged at ${new Date().toISOString()}: Status Code ${response.status}`);
    })
    .catch((error) => {
      console.error(`Error pinging at ${new Date().toISOString()}:`, error.message);
    });
}

setInterval(keepAlive, interval);
