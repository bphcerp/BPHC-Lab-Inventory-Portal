import mongoose, { Schema } from 'mongoose';

const ConsumableSchema = new Schema({
  consumableName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'vendors', required: true },
  date: { type: Date, default: Date.now, required: true },
  totalCost: { type: Number },
  consumableCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'ConsumableCategory', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to update 'updatedAt' and calculate 'totalCost' before saving
ConsumableSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  // Automatically calculate totalCost as quantity * unitPrice
  if (this.isModified('quantity') || this.isModified('unitPrice')) {
    this.totalCost = this.quantity * this.unitPrice;
  }
  next();
});

export const ConsumableModel = mongoose.model('Consumable', ConsumableSchema);
