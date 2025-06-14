const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  price: { type: Number, required: true },
  salePrice: { type: Number }, // Giá khuyến mãi
  quantity: { type: Number, required: true },
  image: { type: String, required: true }
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  images: [{ type: String }],
  variants: [VariantSchema],
  description: String,
  category: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });


module.exports = mongoose.model('Product', ProductSchema);
