import mongoose, { Schema, Document, Model } from 'mongoose';
import { ConsumableTransactionModel } from './consumableTransaction';

// Base interfaces without Document
interface ICommentBase {
    text: string;
    createdAt: Date;
}

interface IConsumableBase {
    consumableName: string;
    quantity: number;
    claimedQuantity: number;
    unitPrice: number;
    vendor: mongoose.Types.ObjectId;
    date: Date;
    totalConsumableCost: number;
    totalCost: number;
    categoryFields?: { [key: string]: any };
    addedBy: mongoose.Types.ObjectId;
    issuedBy?: mongoose.Types.ObjectId;
    issuedTo?: mongoose.Types.ObjectId;
    comments: ICommentBase[];
    createdAt: Date;
    updatedAt: Date;
    entryReferenceNumber: string; 
}

// Document interfaces
export interface IComment extends ICommentBase, Document {}
export interface IConsumable extends IConsumableBase, Document {}

// Create comment schema
const CommentSchema = new Schema<IComment>({
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Create consumable schema
const ConsumableSchema = new Schema<IConsumable>(
    {
        consumableName: { type: String, required: true },
        quantity: { type: Number, required: true },
        claimedQuantity: { type: Number, default: 0 },
        unitPrice: { type: Number, required: true },
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'vendors', required: true },
        date: { type: Date, default: Date.now, required: true },
        totalCost: { type: Number },
        totalConsumableCost: { type: Number },
        categoryFields: { type: mongoose.Schema.Types.Mixed, default: {} },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'People', required: true },
        issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'People' },
        issuedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'People' },
        comments: [CommentSchema],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        entryReferenceNumber: { type: String, required: true, unique: true },
    },
    { timestamps: true }
);

// Keep your existing pre-save hook
ConsumableSchema.pre('save', async function (next) {
    this.updatedAt = new Date();
    
    let quantityChange = 0;
    let updatedTotalCost = 0;
    if (this.isNew) {
        quantityChange = this.quantity;
        updatedTotalCost = this.totalConsumableCost + this.totalCost;
    } else if (this.isModified('quantity')) {
        const originalDoc = await ConsumableModel.findById(this._id);
        if (originalDoc) {
            quantityChange = this.quantity - originalDoc.quantity;
        }
    }

    if (this.isModified('quantity') || this.isModified('unitPrice')) {
        this.totalCost = this.quantity * this.unitPrice;
        updatedTotalCost =  this.totalConsumableCost + this.totalCost;
    }

    

    if (quantityChange !== 0) {
        const transaction = new ConsumableTransactionModel({
            consumableName: this.consumableName,
            transactionQuantity: Math.abs(quantityChange),
            transactionDate: this.date,
            remainingQuantity: this.quantity,
            categoryFields: this.categoryFields,
            totalCost: this.totalCost,
            totalConsumableCost: Math.abs(updatedTotalCost),
            addedBy: this.addedBy,
            issuedBy: this.issuedBy,
            issuedTo: this.issuedTo,
            transactionType: quantityChange > 0 ? 'ADD' : 'REDUCE'
        });

        await transaction.save();
    }

    next();
});

ConsumableSchema.virtual('availableQuantity').get(function () {
  return this.quantity - (this.claimedQuantity || 0);
});


// Keep your existing index
ConsumableSchema.index(
    {
        consumableName: 1,
        //unitPrice: 1,
        'categoryFields': 1
    }
);

// Create and export the model
export const ConsumableModel = mongoose.model<IConsumable>('Consumable', ConsumableSchema);
