import mongoose, { Schema, Document } from 'mongoose';

interface IConsumable extends Document {
  consumableName: string;
  quantity: number;
  claimedQuantity: number; // Add this field
  unitPrice: number;
  vendor: mongoose.Schema.Types.ObjectId;
  date: Date;
  totalCost?: number;
  consumableCategory: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConsumableSchema = new Schema<IConsumable>({
  consumableName: { type: String, required: true },
  quantity: { type: Number, required: true },
  claimedQuantity: { type: Number, default: 0 },
  unitPrice: { type: Number, required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'vendors', required: true },
  date: { type: Date, default: Date.now, required: true },
  totalCost: { type: Number },
  consumableCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'ConsumableCategory', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ConsumableSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.isModified('quantity') || this.isModified('unitPrice')) {
    this.totalCost = this.quantity * this.unitPrice;
  }
  next();
});

export const ConsumableModel = mongoose.model<IConsumable>('Consumable', ConsumableSchema);
