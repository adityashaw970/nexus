import React, { useEffect, useState } from "react";
import QuizComponent from "./Quizcomponent.jsx";

const Profile = () => {
  const [user, setUser] = useState("null");

  useEffect(() => {
  const checkLoggedIn = async () => {
    const res = await fetch("http://localhost:5000/auth/status", {
      method: "GET",
      credentials: "include" // important for sending cookies
    });

    const msg = await res.json();
    if (msg.loggedIn && msg.user?.email) {
      setUser(msg.user.email);
    }
    if (window.location.href === "http://localhost:5173/profile") {
      if (!msg.loggedIn || res.status === 404 || !msg.user?.email) {
        window.location.href = '/';
      }
    }
  };

  checkLoggedIn();
}, []);


  // const avatar=user.charAt(0).split('');

  const handleLogout = async () => {
    const res = await fetch("http://localhost:5000/logout", {
      method: "GET",
      credentials: "include",
    });
    const msg = await res.text();
    alert(msg);
    window.location.href = "/";
  };

  return (
    <div className="w-full h-full text-white bg-black ">
      <div className="absolute bg-black w-full flex justify-between p-[2vw]">
        <button className="px-[1.5vw] py-[.7vw] bg-green-600 rounded-md 
             active:scale-95 cursor-pointer lg:text-[1vw] font-semibold uppercase">
            Leaderboard
          </button>
        <div className="flex justify-center items-center gap-4">
         <h1 className="text-[1.3vw]">Welcome, <span className="text-orange-200">{user ? user: "Loading..."}</span>
          </h1>      
          <button onClick={handleLogout} className="px-[2vw] py-[.8vw] bg-red-600 rounded-md active:scale-95 cursor-pointer lg:text-[1vw] font-semibold uppercase">
          Logout
        </button>
        </div>
       
      </div>
      <QuizComponent />
      
    </div>
  );
};

export default Profile;
