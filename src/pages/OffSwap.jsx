import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function OffSwap() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [myDays, setMyDays] = useState([]);
  const [myOffDays, setMyOffDays] = useState([]);
  const [agents, setAgents] = useState([]);

  ////////////////////////////////////////////
  // GET USER + ALL DAYS + OFF DAYS
  ////////////////////////////////////////////
  const fetchUserData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUser(user);

    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(prof);

    // 🧠 كل أيامك
    const { data: schedule } = await supabase
      .from("schedule")
      .select("date, status")
      .eq("user_id", user.id);

    setMyDays(schedule || []);

    // 🔴 أيام OFF
    const offDays = schedule
      ?.filter((d) => d.status === "OFF")
      .map((d) => d.date);

    setMyOffDays(offDays || []);
  }, []);

  ////////////////////////////////////////////
  // GET OFF AGENTS BY DATE
  ////////////////////////////////////////////
  const fetchOffAgents = useCallback(
    async (date) => {
      if (!user) return;

      const { data: schedule } = await supabase
        .from("schedule")
        .select("user_id")
        .eq("date", date)
        .eq("status", "OFF");

      if (!schedule) return;

      const filtered = schedule.filter((s) => s.user_id !== user.id);

      const ids = filtered.map((s) => s.user_id);

      if (ids.length === 0) {
        setAgents([]);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);

      setAgents(profiles || []);
    },
    [user]
  );

  ////////////////////////////////////////////
  // EFFECTS
  ////////////////////////////////////////////
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (selectedDate) {
      fetchOffAgents(selectedDate);
    }
  }, [selectedDate, fetchOffAgents]);

  ////////////////////////////////////////////
  // SUBMIT
  ////////////////////////////////////////////
  const handleSubmit = async () => {
  if (!selectedDate || !selectedAgent) {
    alert("Please select date and agent ❗");
    return;
  }

  // 🔥 يوم الأوف بتاعك
  const myOffDay = myDays.find((d) => d.status === "OFF");

  const { error } = await supabase.from("requests").insert({
    user_id: user.id,
    target_user_id: selectedAgent,

    type: "off",
    sub_type: "swap",

    // 🧠 يوم الأوف بتاع الشخص التاني
    date: selectedDate,

    // 🧠 يوم الأوف بتاعك إنت
    target_date: myOffDay?.date,

    status: "Pending",
  });

  if (error) {
    alert(error.message);
  } else {
    alert("OFF Swap Request Sent ✅");

    setSelectedDate("");
    setSelectedAgent(null);
  }
};

  ////////////////////////////////////////////
  // UI
  ////////////////////////////////////////////
  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>
          Welcome {profile?.full_name || "Agent"} 👋
        </h2>

        <p style={styles.role}>
          {profile?.role?.toUpperCase()}
        </p>

        <button
          style={styles.backBtn}
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Card */}
      <div style={styles.card}>

        {/* 🔴 OFF Days Box */}
        {myOffDays.length > 0 && (
          <div style={styles.myOffBox}>
            Your OFF Day:
            <div style={styles.offList}>
              {myOffDays.map((d, i) => (
                <span key={i} style={styles.offItem}>
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 🧠 All Days */}
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={styles.input}
        >
          <option value="">Select Day</option>

          {myDays
              .filter((d) => d.status !== "OFF") // 👈 هنا السحر
              .map((d, i) => (
            <option key={i} value={d.date}>{d.date}</option>
            ))}
        </select>

        {/* 👥 Available OFF Agents */}
        <div style={styles.agentList}>

          {selectedDate && (
            <div style={styles.countBox}>
              {agents.length === 0
                ? "No OFF agents ❌"
                : `${agents.length} OFF agents available`}
            </div>
          )}

          {agents.map((a) => (
            <div
              key={a.id}
              style={{
                ...styles.agentCard,
                border:
                  selectedAgent === a.id
                    ? "1px solid #00f0ff"
                    : "1px solid #ffffff22",
              }}
              onClick={() => setSelectedAgent(a.id)}
            >
              <h4>👤 {a.full_name}</h4>

              {selectedAgent === a.id && (
                <span style={styles.selected}>✓</span>
              )}
            </div>
          ))}

        </div>

        {/* Submit */}
        <button style={styles.button} onClick={handleSubmit}>
          Submit Request
        </button>

      </div>
    </div>
  );
}

////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a)",
    color: "#fff",
    padding: "40px",
    fontFamily: "Comic Sans MS",
  },

  header: {
    marginBottom: "40px",
  },

  title: {
    fontSize: "25px",
    color: "#c2e019",
  },

  role: {
    color: "#00f0ff",
    marginBottom: "10px",
  },

  backBtn: {
    border: "1px solid #00f0ff",
    padding: "10px",
    background: "transparent",
    color: "#00f0ff",
    cursor: "pointer",
  },

  card: {
    width: "500px",
    margin: "auto",
    padding: "40px",
    border: "1px solid #00f0ff",
    borderRadius: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  input: {
    padding: "15px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ffffff22",
    background: "#63c5dde8",
    color: "#002c49",
  },

  agentList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    maxHeight: "250px",
    overflowY: "auto",
  },

  agentCard: {
    padding: "15px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.05)",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selected: {
    color: "#00f0ff",
    fontSize: "20px",
  },

  countBox: {
    textAlign: "center",
    padding: "10px",
    borderRadius: "8px",
    background: "#020617",
    border: "1px solid #22c55e",
    color: "#22c55e",
    fontWeight: "bold",
  },

  myOffBox: {
    border: "1px solid #f87171",
    padding: "10px",
    borderRadius: "8px",
    color: "#f87171",
    fontWeight: "bold",
    textAlign: "center",
    fontsize: "15px",
  },

  offList: {
    marginTop: "8px",
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
    justifyContent: "center",
  },

  offItem: {
    background: "#020617",
    padding: "5px 8px",
    borderRadius: "5px",
    fontSize: "12px",
  },

  button: {
    padding: "15px",
    border: "1px solid #22c55e",
    background: "transparent",
    color: "#22c55e",
    cursor: "pointer",
  },
};

export default OffSwap;