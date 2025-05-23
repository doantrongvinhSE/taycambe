const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: String, // ảnh cho từng màu
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  image: String,
  variants: [VariantSchema],
  priceSale: Number,
  description: String,
  category: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
}, { timestamps: true });


module.exports = mongoose.model('Product', ProductSchema);
