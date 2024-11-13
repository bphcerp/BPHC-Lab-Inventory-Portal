import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { ConsumableModel } from '../models/consumable';
import { ConsumableCategoryModel } from '../models/consumableCategory';
import { PeopleModel } from '../models/people'; // Import People model
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();

router.get('/latest-reference-number', async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-based (0 = January)
    const currentYear = currentDate.getFullYear();
    
    // Determine financial year
    const financialYearStart = currentMonth >= 3 ? currentYear : currentYear - 1;
    const financialYearEnd = financialYearStart + 1;
    
    // Format financial year as "23-24" for FY 2023-24
    const financialYearPrefix = `${(financialYearStart % 100).toString().padStart(2, '0')}-${(financialYearEnd % 100).toString().padStart(2, '0')}`;
    
    // Financial year pattern for reference number
    const financialYearPattern = `BITS/CON/${financialYearPrefix}`;
    
    // Find the latest consumable with matching financial year reference
    const latestConsumable = await ConsumableModel.findOne(
      { referenceNumber: { $regex: `^${financialYearPattern}` } },
      { referenceNumber: 1 }
    ).sort({ referenceNumber: -1 });

    let nextNumber = 1;
    if (latestConsumable && latestConsumable.referenceNumber) {
      // Extract the last number portion and validate it
      const lastNumberPart = latestConsumable.referenceNumber.split('/').pop();
      const lastNumber = lastNumberPart && !isNaN(Number(lastNumberPart)) ? parseInt(lastNumberPart, 10) : 0;
      nextNumber = lastNumber + 1;
    }

    // Create the next reference number
    const nextReferenceNumber = `${financialYearPattern}/${nextNumber}`;
    res.status(200).json({ referenceNumber: nextReferenceNumber });
  } catch (error) {
    console.error('Error fetching latest reference number:', error);
    res.status(500).json({ message: 'Error fetching latest reference number' });
  }
});

router.use(authenticateToken);

// Utility function for async error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// POST /api/consumable - Add a new consumable
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { 
      consumableName,
      referenceNumber,
      quantity, 
      unitPrice, 
      vendor, 
      date, 
      consumableCategory, 
      categoryFields, 
      addedBy 
    } = req.body;

    // Validate required fields
    if (!consumableName ||  !quantity || !unitPrice || !addedBy) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Validate that addedBy is a valid reference
    const person = await PeopleModel.findById(addedBy);
    if (!person) {
      res.status(400).json({ message: 'Invalid addedBy reference' });
      return;
    }

    let finalReferenceNumber = referenceNumber; // Start with the provided reference number
    
    // If no reference number is provided, generate it
    if (!finalReferenceNumber) {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth(); // 0-based (0 = January)
      const currentYear = currentDate.getFullYear();
      
      // Determine financial year
      const financialYearStart = currentMonth >= 3 ? currentYear : currentYear - 1;
      const financialYearEnd = financialYearStart + 1;
      
      // Format financial year as "23-24" for FY 2023-24
      const financialYearPrefix = `${(financialYearStart % 100).toString().padStart(2, '0')}-${(financialYearEnd % 100).toString().padStart(2, '0')}`;
      
      // Financial year pattern for reference number
      const financialYearPattern = `BITS/CON/${financialYearPrefix}`;
      
      // Find the latest consumable with matching financial year reference
      const latestConsumable = await ConsumableModel.findOne(
        { referenceNumber: { $regex: `^${financialYearPattern}` } },
        { referenceNumber: 1 }
      ).sort({ referenceNumber: -1 });

      let nextNumber = 1;
      if (latestConsumable && latestConsumable.referenceNumber) {
        // Extract the last number portion and validate it
        const lastNumberPart = latestConsumable.referenceNumber.split('/').pop();
        const lastNumber = lastNumberPart && !isNaN(Number(lastNumberPart)) ? parseInt(lastNumberPart, 10) : 0;
        nextNumber = lastNumber + 1;
      }

      // Create the next reference number
      finalReferenceNumber = `${financialYearPattern}/${nextNumber}`;
    }


    const consumable = new ConsumableModel({
      consumableName,
      referenceNumber:finalReferenceNumber,
      quantity,
      unitPrice,
      vendor,
      date,
      consumableCategory,
      categoryFields,
      addedBy // Reference to the person who added this consumable
    });

    await consumable.save();
    res.status(201).json(consumable);
  })
);

// GET /api/consumable - Fetch all consumables
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const consumables = await ConsumableModel.find()
      .populate('vendor') // Populate vendor details
      .populate('consumableCategory') // Populate category details
      .populate('addedBy'); // Populate addedBy with user details

    res.status(200).json(consumables);
  })
);

// GET /api/consumable/:id - Fetch a specific consumable by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const consumableId = req.params.id;

    const consumable = await ConsumableModel.findById(consumableId)
      .populate('vendor')
      .populate('consumableCategory')
      .populate('addedBy');

    if (!consumable) {
      res.status(404).json({ message: 'Consumable not found' });
      return;
    }

    res.status(200).json(consumable);
  })
);

// DELETE /api/consumable/:id - Delete a consumable
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const consumableId = req.params.id;

    const consumable = await ConsumableModel.findById(consumableId);
    if (!consumable) {
      res.status(404).json({ message: 'Consumable not found' });
      return;
    }

    await ConsumableModel.findByIdAndDelete(consumableId);
    res.status(200).json({ message: 'Consumable deleted successfully' });
  })
);

// PUT /api/consumable/:id - Update a consumable
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const consumableId = req.params.id;
    const { consumableName, referenceNumber, quantity, unitPrice, vendor, date, consumableCategory, categoryFields } = req.body;

    const consumable = await ConsumableModel.findById(consumableId);
    if (!consumable) {
      res.status(404).json({ message: 'Consumable not found' });
      return;
    }

    consumable.consumableName = consumableName || consumable.consumableName;
    consumable.referenceNumber = referenceNumber;
    consumable.quantity = quantity || consumable.quantity;
    consumable.unitPrice = unitPrice || consumable.unitPrice;
    consumable.vendor = vendor || consumable.vendor;
    consumable.date = date || consumable.date;
    consumable.consumableCategory = consumableCategory || consumable.consumableCategory;
    consumable.categoryFields = categoryFields || consumable.categoryFields;

    await consumable.save();
    res.status(200).json(consumable);
  })
);

export default router;
