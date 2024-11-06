import mongoose, { Schema, Document } from 'mongoose';

interface IConsumableTransaction extends Document {
  consumableName: string;
  transactionQuantity: number;
  issuerName: string;
  transactionDate: Date;
  remainingQuantity: number;
}

const ConsumableTransactionSchema = new Schema<IConsumableTransaction>({
  consumableName: { type: String, required: true },
  transactionQuantity: { type: Number, required: true },
  issuerName: { type: String, required: false, default: '' },
  transactionDate: { type: Date, default: Date.now, required: true },
  remainingQuantity: { type: Number, required: true },
});

export const ConsumableTransactionModel = mongoose.model<IConsumableTransaction>('ConsumableTransaction', ConsumableTransactionSchema);