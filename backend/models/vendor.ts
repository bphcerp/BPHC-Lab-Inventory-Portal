import mongoose, { Schema } from 'mongoose';

const vendorSchema = new Schema({
  vendorId: {
    type: String,
    unique: true,
    default: () => `VND-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Generate a unique ID
  },
  name: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
});

export const VendorModel = mongoose.model('vendors', vendorSchema);
