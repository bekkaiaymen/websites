const mongoose = require('mongoose');

const hintSchema = new mongoose.Schema({
  budget: String,
  flavors: [String],
  clickedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Hint', hintSchema);