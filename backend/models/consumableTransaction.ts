import mongoose, { Schema, Document } from 'mongoose';
import { IPeople } from './people';

interface IConsumableTransaction extends Document {
  consumableName: string;
  transactionQuantity: number;
  referenceNumber: string;
  transactionDate: Date;
  totalConsumableCost: number;
  remainingQuantity: number;
  categoryFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  addedBy?: mongoose.Schema.Types.ObjectId | IPeople;
  issuedBy?: mongoose.Schema.Types.ObjectId | IPeople;
  issuedTo?: mongoose.Schema.Types.ObjectId | IPeople;
  transactionType: 'ADD' | 'ISSUE';
}

const ConsumableTransactionSchema = new Schema<IConsumableTransaction>({
  consumableName: { type: String, required: true },
  referenceNumber: { 
    type: String, 
    unique: true,
    sparse: true // This allows multiple documents with null/undefined values
  },
  transactionQuantity: { type: Number, required: true },
  transactionDate: { type: Date, default: Date.now, required: true },
  remainingQuantity: { type: Number, required: true },
  categoryFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  totalConsumableCost: { type: Number },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'People' },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'People' },
  issuedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'People' },
  transactionType: { 
    type: String, 
    required: true,
    enum: ['ADD', 'ISSUE']
  }
}, { 
  timestamps: true,
  validateBeforeSave: true 
});

ConsumableTransactionSchema.pre('save', function(next) {
  // For ISSUE transactions, require reference number and issuedBy/issuedTo
  if (this.transactionType === 'ISSUE') {
    if (!this.referenceNumber) {
      next(new Error('Reference number is required for issue transactions'));
    }
    if (!this.issuedBy || !this.issuedTo) {
      next(new Error('Issuer and recipient are required for issue transactions'));
    }
  }
  
  // For ADD transactions, require addedBy
  if (this.transactionType === 'ADD' && !this.addedBy) {
    next(new Error('Added by is required for add transactions'));
  }
  
  next();
});

export const ConsumableTransactionModel = mongoose.model<IConsumableTransaction>('ConsumableTransaction', ConsumableTransactionSchema);
