const mongoose = require("mongoose");

const PageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    indexed: true,
    required: true,
    ref: "user",
  },
  content: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("page", PageSchema);
