const mongoose = require('mongoose');

const hintSettingsSchema = new mongoose.Schema({
  customAddons: [{
    name: String,
    options: [String]
  }],
  readyBoxes: [{
    name: String,
    price: Number,
    description: String,
    image: String
  }]
});

module.exports = mongoose.model('HintSettings', hintSettingsSchema);