import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function LeaveRequest() {
  const [date, setDate] = useState("");
  const [type, setType] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const leaveTypes = ["Annual", "Casual", "Sick", "UPL", "Holiday"];

  const handleSubmit = async () => {
    if (!date || !type) {
      alert("Please fill all fields ❗");
      return;
    }

    setLoading(true);

    const { data } = await supabase.auth.getUser();

    const { error } = await supabase.from("requests").insert({
      user_id: data.user.id,
      type: "leave",
      sub_type: type,
      date,
      status: "Pending",
    });

    setLoading(false);

    if (error) {
      alert("Error ❌");
    } else {
      alert("Request Sent ✅");
      setDate("");
      setType("");
    }
  };

  return (
    <div style={styles.container}>

      {/* 🔙 Back */}
      <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
        ← Back to Dashboard
      </button>

      <h2 style={styles.title}>Leave Request 📝</h2>

      <div style={styles.card}>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={styles.input}
        />

        <button
          style={styles.selectBtn}
          onClick={() => setShowPopup(true)}
        >
          {type || "Choose Leave Type"}
        </button>

        <button
          style={{
            ...styles.submit,
            opacity: loading ? 0.6 : 1,
          }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>

      </div>

      {/* 🔥 Premium Popup */}
      {showPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popup}>

            <h3 style={styles.popupTitle}>Select Leave Type</h3>

            <div style={styles.popupGrid}>
              {leaveTypes.map((t) => (
                <div
                  key={t}
                  style={styles.popupCard}
                  onClick={() => {
                    setType(t);
                    setShowPopup(false);
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow = "0 0 20px #00f0ff")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow = "0 0 10px #00f0ff55")
                  }
                >
                  {t}
                </div>
              ))}
            </div>

            <button
              style={styles.closeBtn}
              onClick={() => setShowPopup(false)}
            >
              Cancel
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

//////////////////////////////////////////////////
// 🎨 STYLES (PREMIUM)
//////////////////////////////////////////////////

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a)",
    color: "#fff",
    padding: "30px",
    fontFamily: "Comic Sans MS",
  },

  backBtn: {
    marginBottom: "20px",
    padding: "8px 16px",
    border: "1px solid #00f0ff",
    borderRadius: "10px",
    background: "transparent",
    color: "#00f0ff",
    cursor: "pointer",
    boxShadow: "0 0 10px #00f0ff55",
  },

  title: {
    textAlign: "center",
    color: "#00f0ff",
    marginBottom: "30px",
  },

  card: {
    width: "420px",
    margin: "auto",
    padding: "30px",
    border: "1px solid #00f0ff",
    borderRadius: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    boxShadow: "0 0 20px #00f0ff33",
  },

  input: {
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #00f0ff",
    background: "#227892",
    color: "#fff",
    fontSize: "16px",
    outline: "none",
  },

  selectBtn: {
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #00f0ff",
    background: "transparent",
    color: "#00f0ff",
    cursor: "pointer",
    boxShadow: "0 0 10px #00f0ff55",
  },

  submit: {
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #22c55e",
    background: "transparent",
    color: "#22c55e",
    cursor: "pointer",
    boxShadow: "0 0 10px #22c55e55",
  },

  popupOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  popup: {
    background: "#020617",
    padding: "25px",
    borderRadius: "15px",
    border: "1px solid #00f0ff",
    boxShadow: "0 0 25px #00f0ff33",
    width: "350px",
    textAlign: "center",
  },

  popupTitle: {
    marginBottom: "15px",
    color: "#00f0ff",
  },

  popupGrid: {
  display: "flex",
  flexDirection: "column",
  gap: "15px", // 🔥 مسافة بين الزراير
  marginBottom: "20px",
  alignItems: "center",
},

 popupCard: {
  width: "80%", // 🔥 مش full width
  padding: "14px",
  border: "1px solid #00f0ff",
  borderRadius: "12px",
  cursor: "pointer",
  background: "#020617",
  boxShadow: "0 0 10px #00f0ff55",
  transition: "0.3s",
  fontSize: "16px",
  textAlign: "center",
},

  closeBtn: {
    padding: "10px",
    border: "1px solid #ef4444",
    borderRadius: "10px",
    background: "transparent",
    color: "#ef4444",
    cursor: "pointer",
  },
};

export default LeaveRequest;