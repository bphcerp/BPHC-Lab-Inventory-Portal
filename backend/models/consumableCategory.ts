import mongoose, { Document, Schema } from 'mongoose';

interface ConsumableCategory extends Document {
    name: string;
}

const consumableCategorySchema: Schema = new Schema({
    name: { type: String, required: true, unique: true }, // Ensures category names are unique
}, { timestamps: true }); // Adds createdAt and updatedAt fields

const ConsumableCategoryModel = mongoose.model<ConsumableCategory>('ConsumableCategory', consumableCategorySchema);

export { ConsumableCategoryModel };
