import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { PeopleModel } from '../models/people';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();
router.use(authenticateToken);

// Utility function for async error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// GET /api/people - Fetch all people
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const people = await PeopleModel.find().sort({ name: 1 }); // Alphabetical order
    res.json(people);
  })
);

// POST /api/people - Add a new person
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, phone } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    const existingPerson = await PeopleModel.findOne({ name: name.trim() });
    if (existingPerson) {
      res.status(400).json({ message: 'Person already exists' });
      return;
    }

    // Check for duplicate email if provided
    if (email) {
      const existingEmail = await PeopleModel.findOne({ email: email.trim() });
      if (existingEmail) {
        res.status(400).json({ message: 'Email already exists' });
        return;
      }
    }

    const newPerson = new PeopleModel({
      name: name.trim(),
      email: email?.trim(),
      phone: phone?.trim()
    });
    
    await newPerson.save();
    res.status(201).json(newPerson);
  })
);

// PUT /api/people/:id - Update a person
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const personId = req.params.id;
    const { name, email, phone } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    const person = await PeopleModel.findById(personId);
    if (!person) {
      res.status(404).json({ message: 'Person not found' });
      return;
    }

    // Check for duplicate names excluding current person
    const existingPerson = await PeopleModel.findOne({ 
      name: name.trim(), 
      _id: { $ne: personId } 
    });
    if (existingPerson) {
      res.status(400).json({ message: 'Another person with the same name already exists' });
      return;
    }

    // Check for duplicate email excluding current person
    if (email) {
      const existingEmail = await PeopleModel.findOne({ 
        email: email.trim(), 
        _id: { $ne: personId } 
      });
      if (existingEmail) {
        res.status(400).json({ message: 'Email already exists' });
        return;
      }
    }

    person.name = name.trim();
    if (email !== undefined) person.email = email.trim();
    if (phone !== undefined) person.phone = phone.trim();
    
    await person.save();
    res.status(200).json(person);
  })
);

// DELETE /api/people/:id - Delete a person
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const personId = req.params.id;

    const person = await PeopleModel.findById(personId);
    if (!person) {
      res.status(404).json({ message: 'Person not found' });
      return;
    }

    await PeopleModel.findByIdAndDelete(personId);
    res.status(200).json({ message: 'Person deleted successfully' });
  })
);



export default router;
