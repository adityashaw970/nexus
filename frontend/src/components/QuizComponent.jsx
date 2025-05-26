import React, { useState, useEffect } from "react";

const quiz = [
  { question: "What is the capital of France?", answer: "Paris" },
  { question: "Who wrote the play 'Romeo and Juliet'?", answer: "William Shakespeare" },
  { question: "What is the chemical symbol for water?", answer: "H2O" },
  { question: "What planet is known as the Red Planet?", answer: "Mars" },
  { question: "What is the largest mammal in the world?", answer: "Blue Whale" },
];

const QuizComponent = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState(Array(quiz.length).fill(""));
  const [timeLeft, setTimeLeft] = useState(30);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Load data on mount
  useEffect(() => {
    const savedAnswers = JSON.parse(localStorage.getItem("quiz_answers"));
    const savedIndex = parseInt(localStorage.getItem("quiz_index"));
    const submitted = localStorage.getItem("quiz_submitted") === "true";
    const questionStartTime = localStorage.getItem("quiz_question_start");

    if (submitted) {
      setIsSubmitted(true);
      if (savedAnswers) {
        const calculatedScore = calculateScore(savedAnswers);
        setScore(calculatedScore);
        setUserAnswers(savedAnswers);
      }
      return;
    }

    if (savedAnswers) setUserAnswers(savedAnswers);
    if (!isNaN(savedIndex)) setCurrentIndex(savedIndex);

    const now = Date.now();
    if (questionStartTime) {
      const elapsed = Math.floor((now - parseInt(questionStartTime)) / 1000);
      const remaining = 30 - elapsed;
      setTimeLeft(remaining > 0 ? remaining : 0);
    } else {
      localStorage.setItem("quiz_question_start", Date.now());
      setTimeLeft(30);
    }
  }, []);

  // Timer
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitted]);

  // Auto next or submit
  useEffect(() => {
    if (isSubmitted) return;

    if (timeLeft === 0) {
      if (currentIndex < quiz.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        localStorage.setItem("quiz_index", nextIndex);
        localStorage.setItem("quiz_question_start", Date.now());
        setTimeLeft(30);
      } else {
        handleSubmit();
      }
    }
  }, [timeLeft]);

  // Handle answer change
  const handleAnswerChange = (e) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = e.target.value;
    setUserAnswers(newAnswers);
    localStorage.setItem("quiz_answers", JSON.stringify(newAnswers));
  };

  // Calculate score
  const calculateScore = (answers) => {
    let score = 0;
    answers.forEach((ans, i) => {
      if (
        ans.trim().toLowerCase() === quiz[i].answer.trim().toLowerCase()
      ) {
        score += 1;
      }
    });
    return score;
  };

  // Submit quiz
  const handleSubmit = () => {
    const finalScore = calculateScore(userAnswers);
    setIsSubmitted(true);
    setScore(finalScore);

    localStorage.setItem("quiz_submitted", "true");
    localStorage.removeItem("quiz_index");
    localStorage.removeItem("quiz_question_start");

    alert("Quiz submitted!");
    console.log("Submitted Answers:", userAnswers);
  };

  // Reset (optional)
  const handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-orange-800">
      {isSubmitted ? (
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">🎉 Quiz Submitted!</h1>
          <p className="text-2xl">Your Score: <span className="text-green-400 font-bold">{score}</span> / {quiz.length}</p>
          <button
            onClick={handleReset}
            className="mt-6 px-6 py-2 bg-red-600 text-white rounded-[1vw] text-[1.5vw]"
          >
            Restart Quiz
          </button>
        </div>
      ) : (
        <>
          <div className="w-[90%] rounded-[2vw] border-2 border-white text-[2vw] leading-[2.6vw] h-[15vw] flex flex-col justify-center items-center text-cyan-300 shadow-md mb-[1vw]">
            <h1 className="uppercase leading-[4vw] text-[2.8vw]">
              Quiz {currentIndex + 1}
            </h1>
            <p className="text-white text-center">{quiz[currentIndex].question}</p>
          </div>

          <textarea
            value={userAnswers[currentIndex]}
            onChange={handleAnswerChange}
            className="h-[12vw] px-[3vw] py-[3.5vw] text-center border-2 rounded-[2vw] w-[90%] text-[2vw] mb-[1vw] text-white bg-black"
            placeholder="Write your answer"
            disabled={isSubmitted || timeLeft <= 0}
          ></textarea>

          <div className="text-[1.5vw] text-orange-400 mt-[1vw]">
            {timeLeft > 0 ? (
              <>Auto next in: <span className="font-bold">{timeLeft}s</span></>
            ) : (
              <span className="text-red-500 font-semibold">Time's up for this question!</span>
            )}
          </div>

          {/* Manual Submit on Last Question */}
          {!isSubmitted && currentIndex === quiz.length - 1 && (
            <button
              onClick={handleSubmit}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-[1vw] text-[1.5vw]"
            >
              Submit Quiz
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default QuizComponent;
