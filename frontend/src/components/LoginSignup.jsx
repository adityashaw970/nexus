import { useEffect } from "react";
import { useRef, useState} from "react";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const loginUsernameRef = useRef(null);
  const loginPasswordRef = useRef(null);

  const signUpUsernameRef = useRef(null);
  const signUpEmailRef = useRef(null);
  const signUpPasswordRef = useRef(null);

  const InputField = ({ label, type, name, inputRef }) => (
    <div className="relative z-0 w-full mb-6 group">
      <input
        type={type}
        name={name}
        required
        ref={inputRef}
        className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-white appearance-none focus:outline-none focus:ring-0 focus:border-cyan-400 peer"
        placeholder=" "
      />
      <label
        htmlFor={name}
        className="absolute text-sm text-white duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:scale-100 peer-focus:-translate-y-6"
      >
        {label}
      </label>
    </div>
  );

  useEffect(() => {
  const checkLoggedIn = async () => {
    const res = await fetch("http://localhost:5000/auth/status", {
      method: "GET",
      credentials: "include"
    });
    const msg = await res.json();

    if (window.location.href === "http://localhost:5173/") {
      if (msg.loggedIn) {
        // console.log(msg.loggedIn, 'login');
        // alert("You are already logged in. Redirecting to profile...");
        window.location.href = '/profile';
      }
    }
  };

  checkLoggedIn();
}, []);

 
  const handleLogin = async (e) => {
  e.preventDefault();
  const username = loginUsernameRef.current.value.trim();
  const password = loginPasswordRef.current.value.trim();
  try {
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const message = await res.text();
    alert(message);
    console.log(res.ok);
    if (res.ok) {
      window.location.href = "/profile";
    }
   
  } catch (err) {
    alert("Login Error");
    console.error(err);
  }
};

const handleSignUp = async (e) => {
  e.preventDefault();
  const username = signUpUsernameRef.current.value.trim();
  const email = signUpEmailRef.current.value.trim();
  const password = signUpPasswordRef.current.value.trim();
  try {
    const res = await fetch("http://localhost:5000/register", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    const message = await res.text();
    alert(message);
    if (res.ok) setIsSignUp(false); // go back to login form
  } catch (err) {
    alert("Sign Up Error");
    console.error(err);
  }
};


  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-[GilM]">
      <div className="relative w-[400px] h-[500px] overflow-hidden bg-black rounded-2xl shadow-[0_0_50px_#0ef] text-white">
        <div
          className={`absolute top-20 left-0 w-full h-full transition-transform duration-700 ${
            isSignUp ? "-translate-y-full" : "translate-y-0"
          }`}
        >
          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            className="absolute top-0 left-0 w-full h-full px-10 py-8 bg-black"
          >
            <h2 className="text-cyan-400 text-3xl text-center mb-6 font-bold">Login</h2>
            <InputField
              label="Username"
              type="text"
              name="login-username"
              inputRef={loginUsernameRef}
            />
            <InputField
              label="Password"
              type="password"
              name="login-password"
              inputRef={loginPasswordRef}
            />
            <button
              type="submit"
              className="w-full bg-cyan-400 text-black font-semibold py-2 rounded-full shadow-[0_0_10px_#0ef] hover:bg-cyan-300"
            >
              Login
            </button>
            <p className="text-sm text-center mt-4">
              Don&apos;t have an account?{" "}
              <span
                onClick={() => setIsSignUp(true)}
                className="text-cyan-400 cursor-pointer hover:underline"
              >
                Sign Up
              </span>
            </p>
          </form>

          {/* Signup Form */}
          <form
            onSubmit={handleSignUp}
            className="absolute top-full left-0 w-full h-full px-10 py-8 bg-black"
          >
            <h2 className="text-cyan-400 text-3xl text-center mb-3 font-bold">Sign Up</h2>
            <InputField
              label="Username"
              type="text"
              name="signup-username"
              inputRef={signUpUsernameRef}
            />
            <InputField
              label="Email"
              type="email"
              name="signup-email"
              inputRef={signUpEmailRef}
            />
            <InputField
              label="Password"
              type="password"
              name="signup-password"
              inputRef={signUpPasswordRef}
            />
            <button
              type="submit"
              className="w-full bg-cyan-400 text-black font-semibold py-2 rounded-full shadow-[0_0_10px_#0ef] hover:bg-cyan-300"
            >
              Sign Up
            </button>
            <p className="text-sm text-center mt-4">
              Already have an account?{" "}
              <span
                onClick={() => setIsSignUp(false)}
                className="text-cyan-400 cursor-pointer hover:underline"
              >
                Sign In
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
