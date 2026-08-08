import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function ShiftSwap() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [myDays, setMyDays] = useState([]);
  const [agents, setAgents] = useState([]);
  const [myShift, setMyShift] = useState("");

  ////////////////////////////////////////////
  // GET USER + MY DAYS
  ////////////////////////////////////////////
  const fetchUserData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUser(user);

    // 🧠 جيب أيامك (مش OFF)
    const { data: schedule } = await supabase
      .from("schedule")
      .select("date, shift")
      .eq("user_id", user.id)
      .eq("status", "WORK"); // ✅ بدل neq OFF

    setMyDays(schedule || []);
  }, []);

  ////////////////////////////////////////////
  // GET AGENTS BY DATE
  ////////////////////////////////////////////
  const fetchAgentsByDate = useCallback(
    async (date) => {
      if (!user) return;

      const { data: schedule } = await supabase
        .from("schedule")
        .select("user_id, shift")
        .eq("date", date)
        .eq("status", "WORK"); // ✅ أهم تعديل

      if (!schedule) return;

      const my = schedule.find((s) => s.user_id === user.id);
        setMyShift(my?.shift || "");

      // ❌ استبعد نفسك
      const filtered = schedule.filter((s) => s.user_id !== user.id);

      const ids = filtered.map((s) => s.user_id);

      if (ids.length === 0) {
        setAgents([]);
        return;
      }

      // 🧠 هات أسماء الناس
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);

      const final = filtered.map((s) => {
        const p = profiles.find((x) => x.id === s.user_id);

        return {
                id: s.user_id,
                name: p?.full_name || "Unknown",
                shift: s.shift,
                date: date, // 🔥 مهم
              };
      });

      setAgents(final);
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
      fetchAgentsByDate(selectedDate);
    }
  }, [selectedDate, fetchAgentsByDate]);

  ////////////////////////////////////////////
  // SUBMIT
  ////////////////////////////////////////////
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate || !targetUserId) {
      alert("Please select date and agent");
      return;
    }

    await supabase.from("requests").insert([
  {
    user_id: user.id,

    // 👤 الشخص التاني
    target_user_id: targetUserId,

    type: "shift",

    // 📅 يومي أنا
    date: selectedDate,

    // 📅 يوم التارجت
    target_date: selectedDate,

    status: "Pending",
  },
    ]);

    alert("Request Sent 🚀");
  };

return (
    <div style={styles.container}>
      <h1 style={styles.title}>Shift Swap 🔄</h1>

     <div style={styles.topBar}>
  <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
    ← Back to Dashboard
  </button>
</div>

      <form style={styles.card} onSubmit={handleSubmit}>
        
        {/* DAYS */}
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={styles.input}
        >
          <option value="">Select Day</option>

          {myDays.map((d, i) => (
            <option key={i} value={d.date}>
              {d.date}
            </option>
          ))}
        </select>

        {selectedDate && (
  <div style={styles.myShiftBox}>
    Your Shift: <span style={styles.myShiftText}>{myShift || "--"}</span>
  </div>
)}

        {/* AGENTS */}
        <select
  value={targetUserId}
  onChange={(e) => {
  setTargetUserId(e.target.value);
}}
  style={styles.input}
>
          <option value="">Select Agent</option>

          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.shift})
            </option>
          ))}
        </select>
        <button style={styles.btn}>Submit Request</button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    background: "#020617",
    minHeight: "100vh",
    padding: "30px",
    color: "white",
    textAlign: "center",
    fontweight: "bold",
    fontFamily: "Comic Sans MS",
  },

  title: {
    color: "#22d3ee",
    marginBottom: "20px",
    fontFamily: "Comic Sans MS",
    fontweight: "bold",
    fontsize: "25px",
  },

  backBtn: {
    marginBottom: "20px",
    padding: "10px 15px",
    background: "transparent",
    border: "1px solid #22d3ee",
    color: "#22d3ee",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "Comic Sans MS",
    fontweight: "bold",
  },

  card: {
  margin: "auto",
  width: "500px", // 👈 كبرناها
  padding: "35px",
  borderRadius: "20px",
  background: "#0f172a",
  boxShadow: "0 0 25px #22d3ee",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
},

  input: {
  padding: "14px",
  fontSize: "15px",
  borderRadius: "10px",
  border: "1px solid #22d3ee",
  background: "#0f172a",
  color: "#22d3ee",
  outline: "none",
},

  btn: {
  padding: "15px",
  border: "none",
  background: "#22c55e",
  color: "#020617",
  fontWeight: "bold",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "0.2s",
},

  topBar: {
  display: "flex",
  justifyContent: "flex-start",
  marginBottom: "20px",
},

myShiftBox: {
  background: "#020617",
  border: "1px solid #22d3ee",
  padding: "10px",
  borderRadius: "8px",
  color: "#22d3ee",
  fontWeight: "bold",
  textAlign: "center",
},

myShiftText: {
  color: "#fff",
},

agentCard: {
  padding: "15px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.05)",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  transition: "0.2s ease",
},
};
export default ShiftSwap;