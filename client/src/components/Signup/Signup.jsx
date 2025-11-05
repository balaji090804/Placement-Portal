import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import styles from "./styles.module.css";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { auth, provider, signInWithPopup } from "../../lib/firebase";

const Signup = () => {
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    Skills: "",
    role: "student", // Default role
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = ({ currentTarget: input }) => {
    setData({ ...data, [input.name]: input.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = "http://localhost:8080/api/users"; // Ensure correct API path
      const { data: res } = await axios.post(url, data);
      alert("Signup Successful! Please login.");
      navigate("/login");
    } catch (error) {
      if (
        error.response &&
        error.response.status >= 400 &&
        error.response.status <= 500
      ) {
        setError(error.response.data.message);
      }
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Ensure a corresponding backend user exists; receive app JWT & role
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

      // Redirect by role similar to Login flow
      if (res.role === "student") {
        window.location.replace("/StudentDashboard/HomeHero");
      } else if (res.role === "faculty") {
        window.location.replace("/FacultyDashboard/Dashboard");
      } else if (res.role === "admin") {
        window.location.replace("/AdminPlacementDashboard/AdminDashboard");
      } else {
        window.location.replace("/login");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Google signup failed";
      setError(msg);
    }
  };

  return (
    <div className={styles.signup_page}>
      <div className={styles.signup_container}>
        <div className={styles.signup_form_container}>
          <div className={styles.left}>
            <h1>Welcome Back</h1>
            <Link to="/login">
              <button type="button" className={styles.white_btn}>
                Sign in
              </button>
            </Link>
          </div>
          <div className={styles.right}>
            <form className={styles.form_container} onSubmit={handleSubmit}>
              <h1>Create Account</h1>
              <input
                type="text"
                placeholder="First Name"
                name="firstName"
                onChange={handleChange}
                value={data.firstName}
                required
                className={styles.input}
              />
              <input
                type="text"
                placeholder="Last Name"
                name="lastName"
                onChange={handleChange}
                value={data.lastName}
                required
                className={styles.input}
              />
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
              {/* Skills input only visible for students */}
              {data.role === "student" && (
                <input
                  type="text"
                  placeholder="Skills (comma separated)"
                  name="Skills"
                  onChange={handleChange}
                  value={data.Skills}
                  required
                  className={styles.input}
                />
              )}

              {/* Role Selection */}
              <label>Select Role:</label>
              <select
                name="role"
                value={data.role}
                onChange={handleChange}
                className={styles.input}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>

              {error && <div className={styles.error_msg}>{error}</div>}
              <div className={styles.buttonRow}>
                <button type="submit" className={styles.green_btn}>
                  Sign Up
                </button>
                <button
                  type="button"
                  className={styles.white_btn}
                  onClick={handleGoogleSignup}
                >
                  Sign up with Google
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
