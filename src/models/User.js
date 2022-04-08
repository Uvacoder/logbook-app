const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  githubId: {
    type: mongoose.Schema.Types.Number,
    indexed: true,
    required: true,
  },
  githubUsername: {
    type: mongoose.Schema.Types.String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("user", UserSchema);
