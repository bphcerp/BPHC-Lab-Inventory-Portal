import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { ConsumableCategoryModel } from '../models/consumableCategory';
import { authenticateToken } from '../middleware/authenticateToken';

interface Field {
  name: string;
  values: string[];
}

interface ConsumableCategoryRequest {
  consumableName: string;
  fields: Field[];
}

const router = express.Router();
router.use(authenticateToken);

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const categories = await ConsumableCategoryModel.find();
  res.status(200).json(categories);
}));

router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
        // Debug log to see incoming request body
        console.log('Received request body:', req.body);
        
        const { consumableName, fields } = req.body as ConsumableCategoryRequest;

        // Debug log after destructuring
        console.log('Destructured values:', { consumableName, fields });

        // Validate consumable name
        if (!consumableName?.trim()) {
            console.log('Validation failed: consumable name is empty');
            res.status(400).json({ message: 'Consumable name is required' });
            return;
        }

        // Validate fields array
        if (!Array.isArray(fields)) {
            console.log('Validation failed: fields is not an array');
            res.status(400).json({ message: 'Fields must be an array' });
            return;
        }

        if (fields.length === 0) {
            console.log('Validation failed: fields array is empty');
            res.status(400).json({ message: 'At least one field is required' });
            return;
        }

        // Validate each field
        for (const field of fields) {
            if (!field.name?.trim()) {
                console.log('Validation failed: field name is empty');
                res.status(400).json({ message: 'Each field must have a name' });
                return;
            }

            if (!Array.isArray(field.values)) {
                console.log('Validation failed: field values is not an array');
                res.status(400).json({ message: 'Field values must be an array' });
                return;
            }

            if (field.values.length === 0) {
                console.log('Validation failed: field values array is empty');
                res.status(400).json({ 
                    message: `Field "${field.name}" must have at least one value` 
                });
                return;
            }

            const hasInvalidValue = field.values.some(value => 
                typeof value !== 'string' || value.trim() === ''
            );
            
            if (hasInvalidValue) {
                console.log('Validation failed: field has invalid values');
                res.status(400).json({ 
                    message: `All values for field "${field.name}" must be non-empty strings` 
                });
                return;
            }
        }

        // Check for existing category
        const existingCategory = await ConsumableCategoryModel.findOne({
            consumableName: consumableName.trim()
        });

        if (existingCategory) {
            console.log('Validation failed: category already exists');
            res.status(400).json({ 
                message: `Category with name "${consumableName}" already exists` 
            });
            return;
        }

        // Create new category
        const cleanedFields = fields.map(field => ({
            name: field.name.trim(),
            values: field.values.map(v => v.trim()).filter(v => v !== '')
        }));

        const newCategory = new ConsumableCategoryModel({
            consumableName: consumableName.trim(),
            fields: cleanedFields
        });

        // Debug log before saving
        console.log('Attempting to save category:', newCategory.toObject());

        await newCategory.save();
        
        console.log('Category saved successfully');
        res.status(201).json(newCategory);
    } catch (error: any) {
        console.error('Detailed error in category creation:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code
        });
        
        if (error.name === 'ValidationError') {
            res.status(400).json({ 
                message: 'Validation error', 
                details: error.message 
            });
            return;
        }

        if (error.code === 11000) {
            res.status(400).json({ 
                message: 'Duplicate category name' 
            });
            return;
        }

        res.status(500).json({ 
            message: 'Internal server error while creating category',
            error: error.message
        });
    }
}));

// Add this to the existing router file (paste.txt)
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Validate that the ID is provided
        if (!id) {
            console.log('Validation failed: no ID provided');
            res.status(400).json({ message: 'Category ID is required' });
            return;
        }

        // Attempt to find and delete the category
        const deletedCategory = await ConsumableCategoryModel.findByIdAndDelete(id);

        // Check if the category was found and deleted
        if (!deletedCategory) {
            console.log(`Category with ID ${id} not found`);
            res.status(404).json({ message: 'Category not found' });
            return;
        }

        console.log(`Category "${deletedCategory.consumableName}" deleted successfully`);
        res.status(200).json({ 
            message: 'Category deleted successfully',
            deletedCategory: {
                id: deletedCategory._id,
                consumableName: deletedCategory.consumableName
            }
        });
    } catch (error: any) {
        console.error('Error deleting category:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        res.status(500).json({ 
            message: 'Internal server error while deleting category',
            error: error.message
        });
    }
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { consumableName, fields } = req.body as ConsumableCategoryRequest;

        // Debug log
        console.log('Update request:', { id, consumableName, fields });

        // Validate ID
        if (!id) {
            res.status(400).json({ message: 'Category ID is required' });
            return;
        }

        // Validate consumable name
        if (!consumableName?.trim()) {
            res.status(400).json({ message: 'Consumable name is required' });
            return;
        }

        // Validate fields array
        if (!Array.isArray(fields)) {
            res.status(400).json({ message: 'Fields must be an array' });
            return;
        }

        if (fields.length === 0) {
            res.status(400).json({ message: 'At least one field is required' });
            return;
        }

        // Validate each field
        for (const field of fields) {
            if (!field.name?.trim()) {
                res.status(400).json({ message: 'Each field must have a name' });
                return;
            }

            if (!Array.isArray(field.values)) {
                res.status(400).json({ message: 'Field values must be an array' });
                return;
            }

            if (field.values.length === 0) {
                res.status(400).json({ 
                    message: `Field "${field.name}" must have at least one value` 
                });
                return;
            }

            const hasInvalidValue = field.values.some(value => 
                typeof value !== 'string' || value.trim() === ''
            );
            
            if (hasInvalidValue) {
                res.status(400).json({ 
                    message: `All values for field "${field.name}" must be non-empty strings` 
                });
                return;
            }
        }

        // Check for existing category with same name (excluding current category)
        const existingCategory = await ConsumableCategoryModel.findOne({
            _id: { $ne: id },
            consumableName: consumableName.trim()
        });

        if (existingCategory) {
            res.status(400).json({ 
                message: `Category with name "${consumableName}" already exists` 
            });
            return;
        }

        // Clean and update the category
        const cleanedFields = fields.map(field => ({
            name: field.name.trim(),
            values: field.values.map(v => v.trim()).filter(v => v !== '')
        }));

        const updatedCategory = await ConsumableCategoryModel.findByIdAndUpdate(
            id,
            {
                consumableName: consumableName.trim(),
                fields: cleanedFields
            },
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            res.status(404).json({ message: 'Category not found' });
            return;
        }

        console.log('Category updated successfully:', updatedCategory);
        res.status(200).json(updatedCategory);
    } catch (error: any) {
        console.error('Error updating category:', error);
        
        if (error.name === 'ValidationError') {
            res.status(400).json({ 
                message: 'Validation error', 
                details: error.message 
            });
            return;
        }

        if (error.code === 11000) {
            res.status(400).json({ 
                message: 'Duplicate category name' 
            });
            return;
        }

        res.status(500).json({ 
            message: 'Internal server error while updating category',
            error: error.message
        });
    }
}));


export default router;
