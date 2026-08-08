import { useState } from "react";
import { supabase } from "../supabase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  //////////////////////////////////////////
  // LOGIN
  //////////////////////////////////////////
  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password ❗");
      return;
    }

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      // 🔥 يحل مشكلة الريفريش
      window.location.href = "/dashboard";

    } catch (err) {
      console.error(err);
      alert("Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  //////////////////////////////////////////
  // SIGNUP
  //////////////////////////////////////////
  const handleSignup = async () => {
    if (!email || !password) {
      alert(
        "Enter email and password first ❗"
      );
      return;
    }

    try {
      setLoading(true);

      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      const user = data.user;

      // create profile row automatically
      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          full_name: "New User",
          role: "agent",
        });

      if (profileError) {
        alert(
          profileError.message
        );
      } else {
        alert(
          "Account created successfully ✅\nNow update full name / HR ID / leader from Supabase profiles table."
        );
      }

      alert(
  "Account created successfully ✅ You can login now."
);

// مهم جدًا
await supabase.auth.signOut();

// تنظيف inputs
setEmail("");
setPassword("");

// يرجع الصفحة clean
window.location.reload();

    } catch (err) {
      console.log(err);
      alert("Signup failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      
      {/* Logo Area */}
      <div style={styles.logoArea}>
        {/* logo later */}
      </div>

      {/* Login Box */}
      <div style={styles.loginBox}>
        <h2 style={styles.title}>
          Welcome to Capsule WFM System 👋
        </h2>

        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        {/* Login */}
        <button
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
            cursor: loading
              ? "not-allowed"
              : "pointer",
          }}
          onClick={handleLogin}
          disabled={loading}
          onMouseEnter={(e) =>
            !loading &&
            (e.currentTarget.style.boxShadow =
              "0 0 20px #00f0ff")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow =
              "0 0 10px #00f0ff55")
          }
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>

        {/* Signup */}
        <button
          style={styles.signupBtn}
          onClick={handleSignup}
          disabled={loading}
          onMouseEnter={(e) =>
            !loading &&
            (e.currentTarget.style.boxShadow =
              "0 0 20px #a3e635")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow =
              "0 0 10px #a3e63555")
          }
        >
          {loading
            ? "Creating..."
            : "Create New Account"}
        </button>
      </div>
    </div>
  );
}

//////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#020617,#0f172a)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    fontFamily: "Papyrus",
  },

  logoArea: {
    position: "absolute",
    top: "30px",
    left: "30px",
    width: "200px",
    height: "60px",
    border:
      "1px dashed #00f0ff55",
    borderRadius: "10px",
  },

  loginBox: {
    width: "500px",
    padding: "40px",
    border: "2px solid #00f0ff",
    borderRadius: "15px",
    background: "#020617",
    boxShadow:
      "0 0 25px #00f0ff33",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    textAlign: "center",
  },

  title: {
    color: "#5acc6d",
    marginBottom: "10px",
    fontSize: "28px",
  },

  input: {
    padding: "14px",
    borderRadius: "8px",
    border:
      "1px solid #00f0ff",
    background: "#020617",
    color: "#fff",
    fontSize: "18px",
    fontFamily:
      "Comic Sans MS",
    outline: "none",
  },

  button: {
    padding: "14px",
    borderRadius: "10px",
    border:
      "1px solid #00f0ff",
    background: "transparent",
    color: "#00f0ff",
    fontWeight: "bold",
    boxShadow:
      "0 0 10px #00f0ff55",
    transition: "0.3s",
    fontSize: "18px",
    fontFamily:
      "Comic Sans MS",
  },

  signupBtn: {
    padding: "14px",
    borderRadius: "10px",
    border:
      "1px solid #a3e635",
    background: "transparent",
    color: "#a3e635",
    fontWeight: "bold",
    boxShadow:
      "0 0 10px #a3e63555",
    transition: "0.3s",
    fontSize: "18px",
    fontFamily:
      "Comic Sans MS",
  },
};

export default Login;