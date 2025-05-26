const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose=require('mongoose');
const cookieParser = require("cookie-parser");
const userModel = require("./models/user"); // Your user schema
const quizResult=require("./models/quizResult")
const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
mongoose.connect("mongodb://127.0.0.1:27017/nexusverve");

app.use(express.json());
app.use(cookieParser());
// ✅ Register Route
app.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const existingUser = await userModel.findOne({ email,username });
    if (existingUser) return res.status(400).send("User already registered");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
    });
      const token = jwt.sign(
      {email: user.email, id:user._id, username: user.username },"shhh");

      res.cookie("token", token, {
      httpOnly: true,
      sameSite: "Lax", // or "None" + secure: true for HTTPS
      // secure: true, // only for HTTPS
      });
      res.send("Registered successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Registration failed");
  }
});


// ✅ Login Route
app.post("/login", async (req, res) => {
    try {
    const { username, password } = req.body;
    const user = await userModel.findOne({ username });
    if (!user) return res.status(400).send("User not found");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).send("Incorrect password");

     const token = jwt.sign(
    { email: user.email, id: user._id,},"shhh");

  
    res.cookie("token", token, {
    httpOnly: true,
    sameSite: "Lax", // or "None" + secure: true for HTTPS
    // secure: true, // only for HTTPS
    });
    res.status(200).send("Login successful");
  } catch (err) {
    console.error(err);
    res.status(500).send("Login failed");
  }
});

// ✅ Middleware

app.get("/auth/status", (req, res) => {
  const token = req.cookies.token;
  console.log("Token:", token);
  if (!token) {
    return res.json({ loggedIn: false });
  }

  try {
    const user = jwt.verify(token, "shhh");
    console.log("User verified:", user);
    res.json({ loggedIn: true, user });
  } catch (err) {
    console.error("Token invalid:", err);
    res.json({ loggedIn: false });
  }
});

// app.get("/leaderboard", async (req, res) => {
//   try {
//     const topUsers = await quizResult.aggregate([
//       {
//         $lookup: {
//           from: "users", // your users collection
//           localField: "userId",
//           foreignField: "_id",
//           as: "userInfo",
//         },
//       },
//       { $unwind: "$userInfo" },
//       {
//         $project: {
//           username: "$userInfo.username",
//           score: 1,
//           submittedAt: 1,
//         },
//       },
//       { $sort: { score: -1, submittedAt: 1 } },
//       { $limit: 10 },
//     ]);

//     res.status(200).json(topUsers);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Failed to get leaderboard");
//   }
// });

const correctAnswers = [
  "Paris",
  "William Shakespeare",
  "H2O",
  "Mars",
  "George Washington",
  "Blue Whale",
];

// Modify the existing /submit-quiz route:
// app.post("/submit-quiz", async (req, res) => {
//   const { answers } = req.body;
//   try {
//     const existing = await quizResult.findOne({ userId: req.user.id });
//     if (existing) return res.status(400).send("Quiz already submitted");

//     // Calculate score
//     let score = 0;
//     for (let i = 0; i < correctAnswers.length; i++) {
//       if (
//         answers[i]?.trim().toLowerCase() === correctAnswers[i].toLowerCase()
//       ) {
//         score++;
//       }
//     }

//     await quizResult.create({
//       userId: req.user.id,
//       answers,
//       score,
//     });

//     res.status(200).send({ message: "Quiz submitted", score });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server error");
//   }
// });


// ✅ Logout Route
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).send("Logged out successfully");
});


app.listen(5000, () => console.log("Backend running on http://localhost:5000"));
