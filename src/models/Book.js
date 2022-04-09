const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  name: {
    type: mongoose.Schema.Types.String,
    indexed: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    indexed: true,
    required: true,
    ref: "user",
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("book", BookSchema);
