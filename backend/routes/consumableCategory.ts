import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { ConsumableCategoryModel } from '../models/consumableCategory';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();

// Apply authenticateToken middleware to all routes in this router
router.use(authenticateToken);

// Utility function for async error handling, ensuring it conforms to `RequestHandler` by returning `Promise<void>`
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// GET /api/consumable-category - Fetch all consumable categories
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const categories = await ConsumableCategoryModel.find();
  res.status(200).json(categories);
}));

// POST /api/consumable-category - Create a new consumable category
router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ message: 'Name is required' });
    return;
  }

  const existingCategory = await ConsumableCategoryModel.findOne({ name });
  if (existingCategory) {
    res.status(400).json({ message: 'Consumable category already exists' });
    return;
  }

  const newCategory = new ConsumableCategoryModel({ name });
  await newCategory.save();

  res.status(201).json(newCategory);
}));

export default router;
