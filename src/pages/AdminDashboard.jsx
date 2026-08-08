import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

function AdminDashboard() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("");
  const [stats, setStats] = useState({
    agents: 0,
    tls: 0,
    pendingRequests: 0,
  });

  //////////////////////////////////////
  // Fetch admin info + stats
  //////////////////////////////////////
  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // admin profile
    const { data: profile } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    setAdminName(
      profile?.full_name || "Admin"
    );

    // count agents
    const { data: agents } =
      await supabase
        .from("profiles")
        .select("id")
        .eq("role", "agent");

    // count TLs
    const { data: tls } =
      await supabase
        .from("profiles")
        .select("id")
        .eq("role", "tl");

    // pending requests
    const { data: requests } =
      await supabase
        .from("requests")
        .select("id")
        .eq("admin_status", "Pending");

    setStats({
      agents: agents?.length || 0,
      tls: tls?.length || 0,
      pendingRequests:
        requests?.length || 0,
    });
  };

  //////////////////////////////////////
  // logout
  //////////////////////////////////////
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleHover = (e) => {
  e.currentTarget.style.boxShadow =
    "0 0 25px #00f0ff";
  e.currentTarget.style.transform =
    "translateY(-5px)";
};

const handleLeave = (e) => {
  e.currentTarget.style.boxShadow =
    "0 0 15px #00f0ff22";
  e.currentTarget.style.transform =
    "translateY(0px)";
};

const getStatus = (shift) => {
  if (!shift) return "OFF";

  const leaveTypes = ["Annual", "Casual", "Sick", "UPL", "Holiday"];

  if (shift === "OFF") return "OFF";

  if (leaveTypes.includes(shift)) return "LEAVE";

  return "WORK";
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// 👇 بعده الفنكشن بتاعتك
const handleUploadSchedule = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const data = await file.arrayBuffer();

  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet);

  console.log(json);

  const finalRows = [];

  for (let row of json) {
    const hr_id = row["HR ID"];

    // نجيب user_id من profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("hr_id", hr_id)
      .single();

    if (!profile) continue;
    console.log("Upload triggered");

    for (let key in row) {
      // أي عمود فيه تاريخ
      if (key.includes("2026")) {
        const date = new Date(key);
        const shift = row[key];

        finalRows.push({
          user_id: profile.id,
          date: formatDate(date),
          shift: shift,
          status: getStatus(shift),
        });
      }
    }
  }

  // 🧨 امسح القديم
await supabase
  .from("schedule")
  .delete()
  .gte("id", "00000000-0000-0000-0000-000000000000");

// 🚀 حط الجديد
await supabase.from("schedule").insert(finalRows);

  alert("Schedule Uploaded 🚀");
};
const formatTime = (value) => {
  if (!value) return "-";

  // لو Excel رجّع رقم
  if (typeof value === "number") {
    const totalMinutes = Math.round(value * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }

  return value; // لو already string
};

const handleUploadBreaks = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const data = await file.arrayBuffer();

  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet);

  const finalRows = [];

  for (let row of json) {
    const hr_id = row["HR ID"];

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("hr_id", hr_id)
      .single();

    if (!profile) continue;

  finalRows.push({
      user_id: profile.id,
      break1: formatTime(row["Break 1 (15 Min)"]),
      break2: formatTime(row["Break 2 (30 Min)"]),
      break3: formatTime(row["Break 3 (15 Min)"]),
});
  }

  // 🧨 امسح القديم
await supabase
  .from("breaks")
  .delete()
  .gte("id", "00000000-0000-0000-0000-000000000000");

// 🚀 حط الجديد
const { error } = await supabase
  .from("breaks")
  .insert(finalRows);

  console.log(error);
  alert("Breaks Uploaded ☕");
};

  return (
    <div style={styles.container}>
      
      {/* Top Section */}
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.welcome}>
            Welcome {adminName} 👑
          </h1>

          <h3 style={styles.role}>
            ADMIN
          </h3>

          <p style={styles.subText}>
            System Control Center
          </p>

          {/* Smart Stats */}
          <div style={styles.statsBox}>
            <span>
              Agents: {stats.agents}
            </span>

            <span>
              TLs: {stats.tls}
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
          style={styles.logoutBtn}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {/* Company Schedule Big Card */}
<div style={styles.topCards}>

  {/* Company Schedule */}
  <div
    style={styles.card}
    onClick={() => navigate("/company-schedule")}
    onMouseEnter={handleHover}
    onMouseLeave={handleLeave}
  >
    <div style={styles.icon}>🗓️</div>
    <h2>Company Schedule</h2>
    <p>View full company shifts</p>
  </div>

  {/* Upload Schedule */}
  <div
    style={styles.card}
    onClick={() =>
      document.getElementById("scheduleInput").click()
    }
    onMouseEnter={handleHover}
    onMouseLeave={handleLeave}
  >
    <div style={styles.icon}>📤</div>
    <h2>Upload Schedule</h2>
    <p>Import shifts</p>
  </div>

  {/* Upload Breaks */}
  <div
    style={styles.card}
    onClick={() =>
      document.getElementById("breaksInput").click()
    }
    onMouseEnter={handleHover}
    onMouseLeave={handleLeave}
  >
    <div style={styles.icon}>☕</div>
    <h2>Upload Breaks</h2>
    <p>Import breaks</p>
  </div>

  {/* hidden inputs */}
  <input
    id="scheduleInput"
    type="file"
    style={{ display: "none" }}
    onChange={handleUploadSchedule}
  />

  <input
    id="breaksInput"
    type="file"
    style={{ display: "none" }}
    onChange={handleUploadBreaks}
  />

</div>

{/* Grid Cards */}
<div style={styles.grid}>

  {/* All Requests */}
  <div
    style={styles.card}
    onClick={() => navigate("/all-requests")}
    onMouseEnter={handleHover}
    onMouseLeave={handleLeave}
  >
    <div style={styles.icon}>✉️</div>
    <h2>All Requests</h2>
    <p>Company approvals</p>
  </div>

  {/* All Employees */}
  <div
    style={styles.card}
    onClick={() => navigate("/all-employees")}
    onMouseEnter={handleHover}
    onMouseLeave={handleLeave}
  >
    <div style={styles.icon}>👥</div>
    <h2>All Employees</h2>
    <p>Manage employees</p>
  </div>

  {/* Company Performance */}
  <div
    style={styles.card}
    onClick={() => navigate("/company-performance")}
    onMouseEnter={handleHover}
    onMouseLeave={handleLeave}
  >
    <div style={styles.icon}>📈</div>
    <h2>Company Performance</h2>
    <p>Track all teams</p>
  </div>

  {/* Create Employee */}
  <div
    style={styles.card}
    onClick={() => navigate("/create-employee")}
    onMouseEnter={handleHover}
    onMouseLeave={handleLeave}
  >
    <div style={styles.icon}>➕</div>
    <h2>Create Employee</h2>
    <p>Add new users</p>
  </div>

  {/* Score Card */}
  <div
    style={styles.card}
    onClick={() => navigate("/score-card")}
    onMouseEnter={handleHover}
    onMouseLeave={handleLeave}
  >
    <div style={styles.icon}>🏆</div>
    <h2>Score Card</h2>
    <p>Coming Soon</p>
  </div>

  {/* Company Attendance */}
  <div
    style={styles.card}
    onClick={() => navigate("/company-attendance")}
    onMouseEnter={handleHover}
    onMouseLeave={handleLeave}
  >
    <div style={styles.icon}>⏰</div>
    <h2>Company Attendance</h2>
    <p>Track full company attendance</p>
  </div>

</div>
    </div>
  );
}

export default AdminDashboard;

//////////////////////////////////////////////////
// styles
//////////////////////////////////////////////////

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#020617,#0f172a)",
    color: "#fff",
    padding: "30px",
    fontFamily:"Comic Sans MS",
    fontWeight: "bold",
  },

  topBar: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    fontFamily:"Comic Sans MS",
    fontWeight: "bold",
  },

  welcome: {
    color: "#a3e635",
    fontSize: "25px",
    marginBottom: "10px",
    fontFamily: "Papyrus",
    fontWeight: "bold",
  },

  role: {
    color: "#00f0ff",
    marginBottom: "5px",
    fontSize: "15px",
    fontFamily: "Papyrus",
    fontWeight: "bold",
  },

  subText: {
    color: "#ccc",
    fontFamily:"Comic Sans MS",
    fontWeight: "bold",
  },

  statsBox: {
    display: "flex",
    gap: "20px",
    marginTop: "20px",
    color: "#add8ec",
    fontWeight: "bold",
    fontFamily:"Comic Sans MS",
  },

  logoutBtn: {
    background: "#ef4444",
    border: "none",
    color: "#fff",
    padding: "12px 25px",
    borderRadius: "10px",
    cursor: "pointer",
    fontFamily:"Comic Sans MS",
    fontWeight: "bold",
  },

  bigCard: {
  width: "55%",
  margin: "auto",
  padding: "25px",
  border: "1px solid #00f0ff",
  borderRadius: "18px",
  textAlign: "center",
  cursor: "pointer",
  marginBottom: "30px",
  background: "#0f172a",
  boxShadow: "0 0 20px #00f0ff22",
  fontFamily: "Papyrus",
  transition: "0.3s ease",
},

 grid: {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
},

card: {
  padding: "25px",
  border: "1px solid #00f0ff",
  borderRadius: "15px",
  textAlign: "center",
  cursor: "pointer",
  background: "#0f172a",
  boxShadow: "0 0 15px #00f0ff22",
  fontFamily: "Papyrus",
  transition: "0.3s ease",
},

icon: {
  fontSize: "45px",
  marginBottom: "15px",
},

topCards: {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
  marginBottom: "30px",
},
};