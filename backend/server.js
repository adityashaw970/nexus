// ==== server.js ====
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");
const userModel = require("./models/user");
const quizResultModel = require("./models/quizResult");
const roundResultModel = require("./models/roundResult");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});
const helmet = require("helmet");
app.use(helmet());
const JWT_SECRET = "shhh";

// Quiz Configuration for All Rounds
const QUIZ_CONFIG = {
  1: {
    name: "Round 1",
    scoreMultiplier: 1,
    questionTime: 10000, // 10 seconds
    startTime: "43 13 * * *", 
    questions: [
      { day: "Day 1", round: "Round 1", set: 1, question: "They work with various types of fabrics and garments, including suits, dresses, shirts, trousers, and more. They use sewing machines. By profession, who are they?", answer: "Tailor" },
      { day: "Day 1", round: "Round 1", set: 1, question: "5+5", answer: "10" },
      { day: "Day 1", round: "Round 1", set: 1, question: "This car was first introduced in India in 2005...What is the car's name?", answer: "Swift" },
      { day: "Day 1", round: "Round 1", set: 1, question: "This area typically refers to the concept of space... What is the area?", answer: "Blank Space" },
      { day: "Day 1", round: "Round 1", set: 1, question: "American singer-songwriter known for her country and pop music. Born in 1989... Who is she?", answer: "Taylor Swift" },
      { day: "Day 1", round: "Round 1", set: 2, question: "A male member of a royal family...", answer: "Prince" },
      { day: "Day 1", round: "Round 1", set: 2, question: "A complex psychological state involving feelings...", answer: "Emotion" },
      { day: "Day 1", round: "Round 1", set: 2, question: "An Indian actor who made his debut in 'Rocky' in 1981...", answer: "Sanjay Dutt" },
      { day: "Day 1", round: "Round 1", set: 2, question: "A long-legged freshwater or coastal bird...", answer: "Heron" },
      { day: "Day 1", round: "Round 1", set: 2, question: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.", answer: "Director" },
    ]
  },
  
  2: {
    name: "Round 2",
    scoreMultiplier: 2,
    questionTime: 15000, // 15 seconds
    startTime: "06 19 * * *",
    questions: [
      { day: "Day 2", round: "Round 2", set: 1, question: "Round 2 Question 1...", answer: "Answer1" },
      { day: "Day 2", round: "Round 2", set: 1, question: "Round 2 Question 2...", answer: "Answer2" },
      // Add more Round 2 questions
    ]
  },
  3: {
    name: "Round 3",
    scoreMultiplier: 3,
    questionTime: 20000, // 20 seconds
    startTime: "35 02 * * *",
    questions: [
      { day: "Day 3", round: "Round 3", set: 1, question: "Round 3 Question 1...", answer: "Answer1" },
      // Add more Round 3 questions
    ]
  },
  4: {
    name: "Round 4",
    scoreMultiplier: 5,
    questionTime: 25000, // 25 seconds
    startTime: "35 03 * * *",
    questions: [
      { day: "Day 4", round: "Round 4", set: 1, question: "Round 4 Question 1...", answer: "Answer1" },
      // Add more Round 4 questions
    ]
  }
};

// Current quiz state
let currentRound = null;
let currentQuestionIndex = 0;
let currentQuestion = null;
let quizActive = false;
let connectedUsers = new Set();

// Generic Quiz Starter
const startQuiz = (roundNumber) => {
  const config = QUIZ_CONFIG[roundNumber];
  if (!config) {
    console.error(`Round ${roundNumber} configuration not found`);
    return;
  }

  currentRound = roundNumber;
  currentQuestionIndex = 0;
  
  console.log(`Starting ${config.name} with ${config.questions.length} questions`);
  
  processNextQuestion(config);
};

const processNextQuestion = (config) => {
  if (currentQuestionIndex >= config.questions.length) {
    // Quiz ended
    io.emit("quiz-end", { round: currentRound });
    currentQuestion = null;
    quizActive = false;
    currentQuestionIndex = 0;
    currentRound = null;
    return;
  }

  currentQuestion = {
    ...config.questions[currentQuestionIndex],
    roundNumber: currentRound,
    roundName: config.name
  };
  quizActive = true;
  
  io.emit("question", {
    ...currentQuestion,
    index: currentQuestionIndex,
    totalQuestions: config.questions.length,
    round: currentRound,
    roundName: config.name,
    scoreMultiplier: config.scoreMultiplier
  });

  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < config.questions.length) {
      processNextQuestion(config);
    } else {
      io.emit("quiz-end", { round: currentRound });
      currentQuestion = null;
      quizActive = false;
      currentQuestionIndex = 0;
      currentRound = null;
    }
  }, config.questionTime);
};

// Socket.IO Connection Handler
io.on("connection", (socket) => {
  connectedUsers.add(socket.id);

  // Handle initial connection
  socket.on("get-initial", () => {
    if (currentQuestion !== null && quizActive) {
      const config = QUIZ_CONFIG[currentRound];
      socket.emit("question", { 
        ...currentQuestion, 
        index: currentQuestionIndex,
        totalQuestions: config.questions.length,
        round: currentRound,
        roundName: config.name,
        scoreMultiplier: config.scoreMultiplier
      });
    }
  });

  socket.on("answer", async ({ answer, userId, questionIndex }) => {
    try {
      // Validate input
      if (!userId || typeof userId !== "string") {
        socket.emit("error", { message: "Invalid userId" });
        return;
      }

      if (!Array.isArray(answer) || answer.length !== 1) {
        socket.emit("error", { message: "Answer must be an array with exactly one element" });
        return;
      }

      // Get current round questions and validate
      if (!currentRound || !QUIZ_CONFIG[currentRound]) {
        socket.emit("error", { message: "No active quiz round" });
        return;
      }

      const config = QUIZ_CONFIG[currentRound];
      const quiz = config.questions;

      // Validate question index
      if (questionIndex < 0 || questionIndex >= quiz.length) {
        socket.emit("error", { message: "Invalid question index" });
        return;
      }

      function containsWord(sentence, word) {
        if (!word || !sentence || word.trim() === '' || sentence.trim() === '') {
          return false;
        }
        // Convert both to lowercase for case-insensitive comparison
        sentence = sentence.toLowerCase();
        word = word.toLowerCase();

        // Use RegExp to match exact word with word boundaries
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(sentence);
      }

      // === Handle Round Result First ===
      let roundRecord = await roundResultModel.findOne({ userId, round: currentRound });
      
      // Get the correct answer and user answer (first element of array)
      let correctAnswer = quiz[questionIndex].answer.toLowerCase().trim();
      let userAnswer = answer[0].toLowerCase().trim();
      const result = containsWord(correctAnswer, userAnswer);
      
      console.log("User Answer:", userAnswer);
      console.log("Correct Answer:", correctAnswer);
      console.log("Answer Check Result:", result);
      console.log("Question Index:", questionIndex);
      
      if (!roundRecord) {
        // Create new round record
        let roundScore = 0;
        
        // Award points if answer is correct
        if (result) {
          roundScore += config.scoreMultiplier;
        }
        
        console.log("Creating new round record with score:", roundScore);
        
        roundRecord = new roundResultModel({
          userId,
          round: currentRound,
          score: roundScore,
          attemptedQuestions: [questionIndex]
        });
      } else {
        // Update existing round record
        console.log("Existing round record found");
        console.log("Current score before update:", roundRecord.score);
        console.log("Current attempted questions:", roundRecord.attemptedQuestions);
        
        // Check if question already attempted to prevent duplicates
        if (!roundRecord.attemptedQuestions.includes(questionIndex)) {
          // Award points if answer is correct
          if (result) {
            roundRecord.score += config.scoreMultiplier;
          }
          roundRecord.attemptedQuestions.push(questionIndex);
          console.log("Added new question to attempted list");
        } else {
          console.log("Question already attempted, no score change");
          // Don't add additional points for duplicate attempts
        }
      }
      
      await roundRecord.save();
      
      console.log("Final round score:", roundRecord.score);
      console.log("Final attempted questions:", roundRecord.attemptedQuestions);

      // === Handle Total Quiz Result ===
      let record = await quizResultModel.findOne({ userId });
      
      if (!record) {
        // Create new total record by calculating from all rounds
        const allRounds = await roundResultModel.find({ userId });
        const totalScore = allRounds.reduce((sum, r) => sum + r.score, 0);
        const totalAttempted = allRounds.reduce((sum, r) => sum + r.attemptedQuestions.length, 0);
        
        record = new quizResultModel({
          userId,
          totalScore: totalScore,
          totalAttemptedQuestions: totalAttempted,
          roundsCompleted: [currentRound]
        });
      } else {
        // Update total record by recalculating from all rounds
        const allRounds = await roundResultModel.find({ userId });
        record.totalScore = allRounds.reduce((sum, r) => sum + r.score, 0);
        record.totalAttemptedQuestions = allRounds.reduce((sum, r) => sum + r.attemptedQuestions.length, 0);
        
        // Add current round to completed rounds if not already there
        if (!record.roundsCompleted.includes(currentRound)) {
          record.roundsCompleted.push(currentRound);
        }
      }
      
      await record.save();

      console.log("Sending score update - Total:", record.totalScore, "Round:", roundRecord.score);

      socket.emit("score-update", {
        totalScore: record.totalScore,
        roundScore: roundRecord.score,
        currentRound: currentRound,
        roundAttempted: roundRecord.attemptedQuestions.length,
        isCorrect: result,
        correctAnswer: quiz[questionIndex].answer
      });

    } catch (err) {
      console.error("Score update error:", err);
      socket.emit("error", { message: "Failed to update score" });
    }
  });

  socket.on("quit-quiz", () => {
    connectedUsers.delete(socket.id);
  });

  socket.on("disconnect", () => {
    connectedUsers.delete(socket.id);
  });
});

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/nexusverve");

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Authentication Routes
app.post("/register", async (req, res) => {
  try {
    let { email, username, password } = req.body;
    let existingUser = await userModel.findOne({ email });
    if (existingUser) return res.status(400).send("User already registered");

    let salt = await bcrypt.genSalt(10);
    let hashedPassword = await bcrypt.hash(password, salt);

    let user = await userModel.create({ username, email, password: hashedPassword });
    let token = jwt.sign({ email: user.email, id: user._id, username: user.username }, JWT_SECRET);

    res.cookie("token", token, { httpOnly: true, sameSite: "Lax" });
    res.send("Registered successfully");
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).send("Registration failed");
  }
});

app.post("/login", async (req, res) => {
  try {
    let { username, password } = req.body;
    let user = await userModel.findOne({ username });
    if (!user) return res.status(400).send("User not found");

    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).send("Incorrect password");

    let token = jwt.sign({ email: user.email, id: user._id, username: user.username }, JWT_SECRET);
    res.cookie("token", token, { httpOnly: true, sameSite: "Lax" });
    res.status(200).send("Login successful");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Login failed");
  }
});

app.get("/auth/status", (req, res) => {
  let token = req.cookies.token;
  if (!token) return res.json({ loggedIn: false });

  try {
    let user = jwt.verify(token, JWT_SECRET);
    res.json({ loggedIn: true, user });
  } catch {
    res.json({ loggedIn: false });
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).send("Logged out successfully");
});

// Leaderboard Route
app.get("/leaderboard", async (req, res) => {
  try {
    const results = await quizResultModel
      .find()
      .sort({ totalScore: -1, createdAt: 1 })
      .populate("userId", "username email")
      .limit(10);

    res.json(results);
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    res.status(500).send("Failed to fetch leaderboard");
  }
});

// User Score Route
app.get("/get-user-score/", async (req, res) => {
  const round = req.query.round;
  try {
    const token = req.cookies.token;
    const requestedRound = round ? parseInt(round) : null;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = jwt.verify(token, JWT_SECRET);
    
    if (requestedRound) {
      // Get specific round data
      const roundScore = await roundResultModel.findOne({ 
        userId: user.id, 
        round: requestedRound 
      });
      
      const config = QUIZ_CONFIG[requestedRound];
      
      res.json({
        round: requestedRound,
        roundName: config?.name || `Round ${requestedRound}`,
        score: roundScore?.score || 0,
        totalQuestions: config?.questions?.length || 0,
        questionAttempt: roundScore?.attemptedQuestions?.length || 0,
        scoreMultiplier: config?.scoreMultiplier || 1
      });
    } else {
      // Get total data
      const totalRecord = await quizResultModel.findOne({ userId: user.id });
      
      res.json({
        totalScore: totalRecord?.totalScore || 0,
        totalAttempted: totalRecord?.totalAttemptedQuestions || 0,
        roundsCompleted: totalRecord?.roundsCompleted || [],
        totalRounds: Object.keys(QUIZ_CONFIG).length
      });
    }

  } catch (err) {
    console.error("Get user score error:", err);
    res.status(500).json({ error: "Failed to fetch score" });
  }
});

// Round Results Route
app.get("/round-results/:round", async (req, res) => {
  try {
    const round = parseInt(req.params.round);
    const results = await roundResultModel
      .find({ round })
      .sort({ score: -1, createdAt: 1 })
      .populate("userId", "username email")
      .limit(10);

    res.json({
      round,
      roundName: QUIZ_CONFIG[round]?.name || `Round ${round}`,
      results
    });
  } catch (err) {
    console.error("Round results fetch error:", err);
    res.status(500).send("Failed to fetch round results");
  }
});

// Start Quiz Manually (for testing)
app.post("/start-quiz/:round", (req, res) => {
  const round = parseInt(req.params.round);
  if (QUIZ_CONFIG[round]) {
    startQuiz(round);
    res.json({ message: `${QUIZ_CONFIG[round].name} started successfully` });
  } else {
    res.status(400).json({ error: "Invalid round number" });
  }
});

// Server Start
server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

// Schedule All Rounds
Object.keys(QUIZ_CONFIG).forEach(roundNumber => {
  const config = QUIZ_CONFIG[roundNumber];
  cron.schedule(config.startTime, () => {
    console.log(`Auto-starting ${config.name}`);
    startQuiz(parseInt(roundNumber));
  });
});