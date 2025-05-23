const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  variantColor: String,
  price: Number,
  quantity: Number
});

const OrderSchema = new mongoose.Schema({
  customerName: String,
  customerEmail: String,
  phone: String,
  shippingAddress: String,
  orderItems: [OrderItemSchema],
  totalAmount: Number,
  status: { type: String, default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
