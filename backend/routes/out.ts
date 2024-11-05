import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { ConsumableModel } from '../models/consumable';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();
router.use(authenticateToken);

// Utility function for async error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// POST /api/consumable/claim/:id - Claim a consumable
router.post('/claim/:id', asyncHandler(async (req: Request, res: Response) => {
  const consumableId = req.params.id;
  const { quantity } = req.body;

  if (typeof quantity !== 'number' || quantity <= 0) {
    res.status(400).json({ message: 'Invalid quantity specified.' });
    return;
  }

  const consumable = await ConsumableModel.findById(consumableId);
  if (!consumable) {
    res.status(404).json({ message: 'Consumable not found' });
    return;
  }

  if (consumable.quantity < quantity) {
    res.status(400).json({ message: 'Insufficient quantity to claim' });
    return;
  }

  consumable.quantity -= quantity;
  consumable.claimedQuantity = (consumable.claimedQuantity || 0) + quantity;
  await consumable.save();

  res.status(200).json({ message: 'Consumable claimed successfully', consumable });
}));

export default router;
