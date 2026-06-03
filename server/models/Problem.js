const mongoose = require("../utils/db");

const ExampleSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String },
});

const TestCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  isPublic: { type: Boolean, default: false }, // If true, can be seen as example / custom test cases
});

const ProblemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Easy",
  },
  constraints: [
    {
      type: String,
    },
  ],
  examples: [ExampleSchema],
  testCases: [TestCaseSchema],
  codeTemplates: {
    javascript: { type: String, default: "" },
    python: { type: String, default: "" },
    cpp: { type: String, default: "" },
    java: { type: String, default: "" },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Problem", ProblemSchema);
