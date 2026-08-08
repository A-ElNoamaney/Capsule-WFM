import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function TLDashboard() {
  const navigate = useNavigate();

  const [leaderName, setLeaderName] =
    useState("");

  const [stats, setStats] = useState({
    teamMembers: 0,
    pendingRequests: 0,
  });

  useEffect(() => {
    fetchLeaderData();
  }, []);

  const fetchLeaderData = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // current TL
    const { data: leaderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const leaderName =
      leaderProfile?.full_name || "Leader";

    setLeaderName(leaderName);

    //////////////////////////////////////
    // TEAM MEMBERS (زي TL Attendance)
    //////////////////////////////////////
    const { data: teamMembers } = await supabase
      .from("profiles")
      .select("id, hr_id")
      .eq("leader_id", leaderName)
      .eq("role", "agent");

    const teamCount = teamMembers?.length || 0;

    //////////////////////////////////////
    // PENDING REQUESTS (زي TLRequests)
    //////////////////////////////////////
    let pendingCount = 0;

    if (teamMembers?.length) {
      const teamIds = teamMembers.map((m) => m.id);

      const { data: requests } = await supabase
        .from("requests")
        .select("id")
        .in("user_id", teamIds)
        .not(
          "admin_status",
          "in",
          '("Approved","Rejected")'
        );

      pendingCount = requests?.length || 0;
    }

    //////////////////////////////////////
    setStats({
      teamMembers: teamCount,
      pendingRequests: pendingCount,
    });

  } catch (err) {
    console.log(err);
  }
};

  const logout =
    async () => {
      await supabase.auth.signOut();
      navigate("/");
    };

  const handleHover = (
    e
  ) => {
    e.currentTarget.style.boxShadow =
      "0 0 30px #00f0ff";
    e.currentTarget.style.transform =
      "translateY(-5px)";
  };

  const handleLeave = (
    e
  ) => {
    e.currentTarget.style.boxShadow =
      "0 0 15px #00f0ff22";
    e.currentTarget.style.transform =
      "translateY(0px)";
  };

  return (
    <div style={styles.container}>
      
      {/* Top */}
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.welcome}>
            Welcome {leaderName} 👋
          </h1>

          <h3 style={styles.role}>
            TEAM LEADER
          </h3>

          <p style={styles.subText}>
            Team Control Center
          </p>

          <div style={styles.statsBox}>
            <span>
              Team Members:{" "}
              {
                stats.teamMembers
              }
            </span>

            <span>
              Pending Requests:{" "}
              {
                stats.pendingRequests
              }
            </span>
          </div>
        </div>

        <button
          style={
            styles.logoutBtn
          }
          onClick={logout}
        >
          Logout
        </button>
      </div>

      {/* Big Schedule Card */}
      <div
        style={
          styles.bigCard
        }
        onClick={() =>
          navigate(
            "/tl-schedule"
          )
        }
        onMouseEnter={
          handleHover
        }
        onMouseLeave={
          handleLeave
        }
      >
        <div style={styles.icon}>
          🗓️
        </div>

        <h2>
          Team Schedule
        </h2>

        <p>
          View your team shifts
        </p>
      </div>

      {/* Grid */}
      <div style={styles.grid}>
        
        <div
          style={
            styles.card
          }
          onClick={() =>
            navigate(
              "/tl-performance"
            )
          }
          onMouseEnter={
            handleHover
          }
          onMouseLeave={
            handleLeave
          }
        >
          <div style={styles.icon}>
            📈
          </div>
          <h2>
            Team Performance
          </h2>
          <p>
            Track team KPIs
          </p>
        </div>

        <div
          style={
            styles.card
          }
          onClick={() =>
            navigate(
              "/tl-attendance"
            )
          }
          onMouseEnter={
            handleHover
          }
          onMouseLeave={
            handleLeave
          }
        >
          <div style={styles.icon}>
            ⏰
          </div>
          <h2>
            Team Attendance
          </h2>
          <p>
            Track attendance
          </p>
        </div>

        <div
          style={
            styles.card
          }
          onClick={() =>
            navigate(
              "/tl-requests"
            )
          }
          onMouseEnter={
            handleHover
          }
          onMouseLeave={
            handleLeave
          }
        >
          <div style={styles.icon}>
            ✉️
          </div>
          <h2>
            My Approvals
          </h2>
          <p>
            Review requests
          </p>
        </div>

        <div
          style={
            styles.card
          }
          onMouseEnter={
            handleHover
          }
          onMouseLeave={
            handleLeave
          }
        >
          <div style={styles.icon}>
            🏆
          </div>
          <h2>
            Score Card
          </h2>
          <p>
            Coming Soon
          </p>
        </div>

      </div>
    </div>
  );
}

export default TLDashboard;

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#020617,#0f172a)",
    color: "#fff",
    padding: "30px",
    fontFamily:
      "Comic Sans MS",
    fontWeight: "bold",
  },

  topBar: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    marginBottom: "20px",
  },

  welcome: {
    color: "#a3e635",
    fontSize: "25px",
    marginBottom: "10px",
  },

  role: {
    color: "#00f0ff",
    fontSize: "15px",
    marginBottom: "5px",
  },

  subText: {
    color: "#ccc",
  },

  statsBox: {
    display: "flex",
    gap: "20px",
    marginTop: "20px",
    color: "#add8ec",
  },

  logoutBtn: {
    background: "#ef4444",
    border: "none",
    color: "#fff",
    padding: "12px 25px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  bigCard: {
    width: "55%",
    margin: "auto",
    padding: "25px",
    border:
      "1px solid #00f0ff",
    borderRadius: "18px",
    textAlign: "center",
    cursor: "pointer",
    marginBottom: "30px",
    background: "#0f172a",
    boxShadow:
      "0 0 20px #00f0ff22",
    transition:
      "0.3s ease",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, 1fr)",
    gap: "20px",
    width: "70%",
    margin: "auto",
  },

  card: {
    padding: "25px",
    border:
      "1px solid #00f0ff",
    borderRadius: "15px",
    textAlign: "center",
    cursor: "pointer",
    background: "#0f172a",
    boxShadow:
      "0 0 15px #00f0ff22",
    transition:
      "0.3s ease",
  },

  icon: {
    fontSize: "45px",
    marginBottom: "15px",
  },
};