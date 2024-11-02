import mongoose, { Schema } from 'mongoose';

const CategorySchema = new Schema({
    name: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    fields: [
        {
            fieldName: { type: String, required: true },
            fieldType: { type: String, enum: ['integer', 'string'], required: true } // Defines data type
        }
    ]
});

export const CategoryModel = mongoose.model('Category', CategorySchema);
