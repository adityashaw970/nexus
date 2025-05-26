const mongoose = require("mongoose");
// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/nexusverve");
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  quizAnswers: [String], // Add this line
});


module.exports = mongoose.model("user", userSchema);
