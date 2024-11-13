import mongoose, { Schema, Document } from 'mongoose';
import { ConsumableTransactionModel } from './consumableTransaction';
import { PeopleModel } from './people'; 

interface IConsumable extends Document {
  consumableName: string;
  referenceNumber: string;
  quantity: number;
  claimedQuantity: number;
  unitPrice: number;
  vendor: mongoose.Schema.Types.ObjectId;
  date: Date;
  totalCost?: number;
  consumableCategory: mongoose.Schema.Types.ObjectId;
  categoryFields?: { [key: string]: any };
  addedBy: mongoose.Schema.Types.ObjectId; 
  issuedBy?: mongoose.Schema.Types.ObjectId;
  issuedTo?: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConsumableSchema = new Schema<IConsumable>({
  consumableName: { type: String, required: true },
  referenceNumber: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true },
  claimedQuantity: { type: Number, default: 0 },
  unitPrice: { type: Number, required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'vendors', required: true },
  date: { type: Date, default: Date.now, required: true },
  totalCost: { type: Number },
  consumableCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'ConsumableCategory', required: true },
  categoryFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'People', required: true },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'People' },
  issuedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'People' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ConsumableSchema.pre('save', async function (next) {
  this.updatedAt = new Date();
  if (this.isModified('quantity') || this.isModified('unitPrice')) {
    this.totalCost = this.quantity * this.unitPrice;
  }

  const transaction = new ConsumableTransactionModel({
    consumableName: this.consumableName,
    transactionQuantity: this.quantity,
    transactionDate: this.date,
    remainingQuantity: this.quantity,
    addedBy: this.isNew ? this.addedBy : undefined,
    issuedBy: this.issuedBy,
    issuedTo: this.issuedTo,
  });

  await transaction.save();
  next();
});

export const ConsumableModel = mongoose.model<IConsumable>('Consumable', ConsumableSchema);
