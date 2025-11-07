import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import styles from "./styles.module.css";
import Sidebar from "../../StudentDashboard/components/Sidebar";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import {
  auth,
  provider,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "../../lib/firebase";

const Login = () => {
  const [data, setData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = ({ currentTarget: input }) => {
    setData({ ...data, [input.name]: input.value });
  };

  // Email/password login via Firebase, then app-side user verification
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = cred.user;

      if (!user.emailVerified) {
        try { await sendEmailVerification(user); } catch {}
        setError(
          "Email not verified. A verification link has been sent to your email. Please verify and sign in again."
        );
        return;
      }

      // Ensure user exists in our backend and get app JWT + role
      const { data: res } = await axios.post(
        "http://localhost:8080/api/check-user",
        {
          userId: user.uid,
          email: user.email,
          name: user.displayName || "",
        }
      );

      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.role);
      if (res.email) localStorage.setItem("studentEmail", res.email);

      if (res.role === "student") {
        window.location.replace("/StudentDashboard");
      } else if (res.role === "faculty") {
        window.location.replace("/FacultyDashboard/Dashboard");
      } else if (res.role === "admin") {
        window.location.replace("/AdminPlacementDashboard/AdminDashboard");
      } else {
        window.location.replace("/login");
      }
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/user-not-found") {
        setError("No account found for this email. Please sign up.");
      } else if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Incorrect password. You can reset your password below.");
      } else {
        const msg = err?.response?.data?.message || err?.message || "Login failed";
        setError(msg);
      }
    }
  };

  const handleResetPassword = async () => {
    setError("");
    if (!data.email) {
      setError("Enter your email to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, data.email);
      alert("Password reset email sent. Check your inbox/spam.");
    } catch (err) {
      setError(err?.message || "Failed to send reset email");
    }
  };

  // Google Sign-In using Firebase
  const handleGoogleLogin = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const { data: res } = await axios.post(
        "http://localhost:8080/api/check-user",
        {
          userId: user.uid,
          email: user.email,
          name: user.displayName || "",
        }
      );
      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.role);
      if (res.email) localStorage.setItem("studentEmail", res.email);
      if (res.role === "student") {
        window.location.replace("/StudentDashboard");
      } else if (res.role === "faculty") {
        window.location.replace("/FacultyDashboard/Dashboard");
      } else if (res.role === "admin") {
        window.location.replace("/AdminPlacementDashboard/AdminDashboard");
      } else {
        window.location.replace("/login");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Google sign-in failed";
      setError(msg);
    }
  };

  return (
    <div className={styles.login_page}>
      <div className={styles.login_container}>
        <div className={styles.login_form_container}>
          <div className={styles.left}>
            <form className={styles.form_container} onSubmit={handleSubmit}>
              <h1>Login to Your Account</h1>
              <input
                type="email"
                placeholder="Email"
                name="email"
                onChange={handleChange}
                value={data.email}
                required
                className={styles.input}
              />
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  name="password"
                  onChange={handleChange}
                  value={data.password}
                  required
                  className={`${styles.input} ${styles.inputWithIcon}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  className={styles.togglePasswordBtn}
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>
              {error && <div className={styles.error_msg}>{error}</div>}
              <button type="submit" className={styles.green_btn}>
                Sign In
              </button>
              <button
                type="button"
                className={styles.white_btn}
                onClick={handleGoogleLogin}
                style={{ marginTop: 10 }}
              >
                Sign in with Google
              </button>
              <button
                type="button"
                className={styles.white_btn}
                onClick={handleResetPassword}
                style={{ marginTop: 10 }}
              >
                Forgot password?
              </button>
            </form>
          </div>
          <div className={styles.right}>
            <h1>New Here?</h1>
            <Link to="/signup">
              <button type="button" className={styles.white_btn}>
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
