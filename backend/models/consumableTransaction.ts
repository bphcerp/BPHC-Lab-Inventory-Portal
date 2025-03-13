// consumableTransaction.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IPeople } from './people';

export interface IConsumableTransaction extends Document {
  transactionId: string;
  consumableName: string;
  consumableId: mongoose.Schema.Types.ObjectId; // Add this field
  transactionQuantity: number;
  referenceNumber: string;
  entryReferenceNumber: string; // Add this field
  transactionDate: Date;
  totalConsumableCost: number;
  remainingQuantity: number;
  categoryFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  addedBy?: mongoose.Schema.Types.ObjectId | IPeople;
  issuedBy?: mongoose.Schema.Types.ObjectId | IPeople;
  issuedTo?: mongoose.Schema.Types.ObjectId | IPeople;
  transactionType: 'ADD' | 'ISSUE';
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean; // Added isDeleted field
}

// Helper function for generating transaction IDs
export const generateTransactionId = (transactionType: 'ADD' | 'ISSUE'): string => {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const prefix = transactionType === 'ADD' ? 'TRX-ADD-' : 'TRX-ISS-';
  return `${prefix}${timestamp}-${randomNum}`;
};

const ConsumableTransactionSchema = new Schema<IConsumableTransaction>({
  transactionId: { 
    type: String, 
    unique: true,
    required: true
  },
  consumableName: { type: String, required: true },
  referenceNumber: { 
    type: String, 
    unique: true,
    sparse: true
  },
  consumableId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Consumable',
    required: true 
  },
  entryReferenceNumber: { 
    type: String, 
    required: function() {
      return this.transactionType === 'ADD'; // Only required for ADD transactions
    },  // Make it required
    index: true      // Index it for faster lookups
  },
  transactionQuantity: { type: Number, required: true },
  transactionDate: { type: Date, default: Date.now, required: true },
  remainingQuantity: { type: Number, required: true },
  categoryFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  totalConsumableCost: { type: Number },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'People' },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'People' },
  issuedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'People' },
  isDeleted: { type: Boolean, default: false }, // Default to false
  transactionType: { 
    type: String, 
    required: true,
    enum: ['ADD', 'ISSUE']
  }
}, { 
  timestamps: true,
  validateBeforeSave: true 
});

// Pre-save middleware for transaction ID generation
ConsumableTransactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = generateTransactionId(this.transactionType);
  }

  if (this.transactionType === 'ISSUE') {
    if (!this.referenceNumber) {
      next(new Error('Reference number is required for issue transactions'));
    }
    if (!this.issuedBy || !this.issuedTo) {
      next(new Error('Issuer and recipient are required for issue transactions'));
    }
  }
  
  if (this.transactionType === 'ADD' && !this.addedBy) {
    next(new Error('Added by is required for add transactions'));
  }
  
  next();
});

ConsumableTransactionSchema.index({ transactionId: 1 }, { unique: true });
ConsumableTransactionSchema.index({ consumableName: 1, transactionDate: -1 });
ConsumableTransactionSchema.index({ entryReferenceNumber: 1 }, { unique: true });

export const ConsumableTransactionModel = mongoose.model<IConsumableTransaction>('ConsumableTransaction', ConsumableTransactionSchema);
