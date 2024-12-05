const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  image: { type: String, required: true },
  propertyType: { 
    type: String, 
    required: true, 
    enum: ["Apartment", "House", "Villa", "Land", "Commercial"] 
  },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  size: { type: Number, required: true },
  features: [{ type: String }],
  listedDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Property", propertySchema);
