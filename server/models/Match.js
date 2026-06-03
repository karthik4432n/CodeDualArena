const mongoose = require("../utils/db");

const MatchSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  player1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  player2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Problem",
    required: true,
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null, // null means a draw or incomplete
  },
  player1Score: {
    type: Number,
    default: 0, // E.g. final rating change
  },
  player2Score: {
    type: Number,
    default: 0,
  },
  player1PassedCases: {
    type: Number,
    default: 0,
  },
  player2PassedCases: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["active", "completed", "abandoned"],
    default: "active",
  },
  mode: {
    type: String,
    enum: ["ranked", "casual"],
    default: "ranked",
  },
  duration: {
    type: Number, // In seconds
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Match", MatchSchema);
