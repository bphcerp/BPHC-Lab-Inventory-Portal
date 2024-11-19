import mongoose, { Document, Schema } from 'mongoose';

interface Field {
    name: string;
    values: string[];
}

interface ConsumableCategory extends Document {
    consumableName: string;
    fields: Field[];
}

const consumableCategorySchema = new Schema({
    consumableName: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    fields: [{
        name: { 
            type: String, 
            required: true, 
            trim: true 
        },
        values: [{ 
            type: String, 
            required: true, 
            trim: true 
        }]
    }]
}, { 
    timestamps: true 
});

// Add index for faster queries
consumableCategorySchema.index({ consumableName: 1 });

export const ConsumableCategoryModel = mongoose.model<ConsumableCategory>(
    'ConsumableCategory',
    consumableCategorySchema
);
