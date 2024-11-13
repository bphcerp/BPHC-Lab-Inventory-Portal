import mongoose, { Schema, Document } from 'mongoose';
import { IPeople } from './people';

interface IConsumableTransaction extends Document {
  consumableName: string;
  transactionQuantity: number;
  transactionDate: Date;
  remainingQuantity: number;
  addedBy?: mongoose.Schema.Types.ObjectId | IPeople;
  issuedBy?: mongoose.Schema.Types.ObjectId | IPeople;
  issuedTo?: mongoose.Schema.Types.ObjectId | IPeople;
}

const ConsumableTransactionSchema = new Schema<IConsumableTransaction>({
  consumableName: { type: String, required: true },
  transactionQuantity: { type: Number, required: true },
  transactionDate: { type: Date, default: Date.now, required: true },
  remainingQuantity: { type: Number, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'People' },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'People' },
  issuedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'People' }
}, { 
  timestamps: true,
  validateBeforeSave: true 
});

ConsumableTransactionSchema.pre('save', function(next) {
  if (!this.addedBy && !this.issuedBy && !this.issuedTo) {
    next(new Error('At least one person (addedBy, issuedBy, or issuedTo) must be specified for the transaction'));
  }
  next();
});

export const ConsumableTransactionModel = mongoose.model<IConsumableTransaction>('ConsumableTransaction', ConsumableTransactionSchema);
