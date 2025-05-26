import React, { useEffect, useState } from "react";
import axios from "axios";

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/leaderboard", { withCredentials: true })
      .then((res) => setLeaders(res.data))
      .catch((err) => console.error("Error loading leaderboard", err));
  }, []);

  return (
    <div className="p-6 text-center">
      <h1 className="text-3xl font-bold text-orange-500 mb-4">🏆 Leaderboard</h1>
      <ul className="text-white space-y-2">
        {leaders.map((user, index) => (
          <li key={index} className="text-lg">
            {index + 1}. {user.username} — {user.score} pts
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
