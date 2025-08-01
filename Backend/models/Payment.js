const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  // Reference to the adoption transaction
  adoptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Adoption', required: true },

  // Seller and buyer for quick query/filter
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Amount paid (EUR cents)
  amount: { type: Number, required: true, min: 0 },

  // Payment status (pending: not paid yet, paid: successful, failed: payment failed, refunded: money returned)
  status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },

  // Payment provider details (e.g., Stripe session id)
  provider: { type: String, default: 'stripe' },
  providerSessionId: { type: String },

  // Payment time
  paidAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
