import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaExchangeAlt,
  FaPlaneDeparture,
  FaUserClock,
  FaChartLine,
  FaSignOutAlt,
} from "react-icons/fa";

function AgentDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [requestStatus, setRequestStatus] = useState({
  text: "",
  color: "#facc15",
});

  useEffect(() => {
  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    //////////////////////////////////////
    // PROFILE
    //////////////////////////////////////
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);

    //////////////////////////////////////
    // REQUEST STATUS
    //////////////////////////////////////
    const { data: requests } = await supabase
      .from("requests")
      .select("status, admin_status")
      .eq("user_id", user.id);

    if (!requests || requests.length === 0) {
      setRequestStatus({
        text: "✔ You don't have pending requests",
        color: "#22c55e",
      });
      return;
    }

    // 🔴 Admin pending
    const adminPending = requests.some(
      (r) =>
        r.status === "Waiting for Admin Response" &&
        r.admin_status === "Pending"
    );

    // 🟡 TL pending
    const tlPending = requests.some(
      (r) => r.status === "Pending"
    );

    if (adminPending) {
      setRequestStatus({
        text: "Waiting for Admin approval ⚠",
        color: "#ef4444",
      });
    } else if (tlPending) {
      setRequestStatus({
        text: "Waiting for Team Leader approval ⚠",
        color: "#facc15",
      });
    } else {
      setRequestStatus({
        text: "No pending requests ✔",
        color: "#22c55e",
      });
    }
  };

  loadData();
}, []);

  

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const buttons = [
    { text: "Shift Swap", icon: <FaExchangeAlt />, path: "/shift-swap", color: "#3b82f6" },
    { text: "Off Swap", icon: <FaExchangeAlt />, path: "/off-swap", color: "#f59e0b" },
    { text: "Leave Request", icon: <FaPlaneDeparture />, path: "/leave", color: "#ef4444" },
    { text: "My Requests", icon: <FaUserClock />, path: "/requests", color: "#22c55e" },
    { text: "My Attendance", icon: <FaUserClock />, path: "/agent-attendance", color: "#a855f7" },
    { text: "My Performance", icon: <FaChartLine />, path: "/performance", color: "#06b6d4" },
  ];

  return (
    <div style={styles.container}>

      {/* 🔝 Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            Welcome {profile?.full_name || "Agent"} 👋
          </h2>

          <p style={styles.role}>
            {profile?.role?.toUpperCase()}
          </p>

          {/* 🧠 Smart Status تحت الرول */}
          <p
  style={{
    ...styles.status,
    color: requestStatus.color,
  }}
>
  {requestStatus.text}
</p>

         </div>

        </div>

      {/* 📅 Schedule */}
      <div style={styles.centerBox}>
        <motion.div
          style={styles.scheduleCard}
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate("/schedule")}
        >
          <FaCalendarAlt size={30} />
          <h3>My Schedule</h3>
          <p>View weekly shifts</p>
        </motion.div>
      </div>

      {/* ⚡ Actions */}
      <div style={styles.actions}>
        <h3 style={styles.actionsTitle}>Quick Actions</h3>

        <div style={styles.grid}>
          {buttons.map((btn, i) => (
            <motion.div
              key={i}
              style={{
                ...styles.card,
                border: `1px solid ${btn.color}`,
                boxShadow: `0 0 15px ${btn.color}33`,
              }}
              whileHover={{
                scale: 1.07,
                backgroundColor: `${btn.color}22`,
                boxShadow: `0 0 25px ${btn.color}`,
              }}
              onClick={() => navigate(btn.path)}
            >
              <div style={{ ...styles.icon, color: btn.color }}>
                {btn.icon}
              </div>

              <p>{btn.text}</p>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default AgentDashboard;

//////////////////////////////////////////////////
// 🎨 STYLES
//////////////////////////////////////////////////

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a)",
    color: "#fff",
    padding: "25px",
    fontFamily: "Comic Sans MS",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: "32px",
    color: "#c2e019",
  },

  role: {
    color: "#00f0ff",
    fontWeight: "bold",
    marginTop: "5px",
  },

  status: {
    color: "#facc15",
    marginTop: "5px",
    fontSize: "14px",
  },

  sub: {
    opacity: 0.6,
    marginTop: "5px",
  },

  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#ff4d4d",
    border: "1px solid #ff4d4d",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontFamily: "Comic Sans MS",
  },

  centerBox: {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
  },

  scheduleCard: {
    width: "500px", // 🔥 أعرض
    padding: "30px",
    borderRadius: "15px",
    textAlign: "center",
    cursor: "pointer",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid #00f0ff",
    boxShadow: "0 0 20px rgba(0,240,255,0.4)",
  },

  actions: {
    marginTop: "25px",
  },

  actionsTitle: {
    color: "#00f0ff",
    marginBottom: "15px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)", // 🔥 رجعنا الجريد
    gap: "20px",
  },

  card: {
    padding: "20px",
    borderRadius: "14px",
    textAlign: "center",
    cursor: "pointer",
    background: "rgba(255,255,255,0.03)",
    fontSize: "18px",
  },

  icon: {
    fontSize: "26px",
    marginBottom: "10px",
  },
};