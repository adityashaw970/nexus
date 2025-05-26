const mongoose = require("mongoose");
const QuizSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  answers: [String],
  score: Number,
  submittedAt: { type: Date, default: Date.now },
});

const quizResult = mongoose.model("quiz", QuizSchema);
