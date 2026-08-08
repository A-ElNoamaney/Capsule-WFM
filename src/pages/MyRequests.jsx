import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("new");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  // 🔥 1. هات الريكوستات
  const { data: requestsData } = await supabase
    .from("requests")
    .select("*")
    .eq("user_id", user.id);

  // 🔥 2. هات كل ال profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, hr_id");

  // 🔥 3. اربطهم manually
  const enriched = requestsData.map((r) => {
    const requester = profiles.find((p) => p.id === r.user_id);
    const target = profiles.find((p) => p.id === r.target_user_id);

    return {
      ...r,
      user_name: requester?.full_name,
      user_hr: requester?.hr_id,
      target_name: target?.full_name,
    };
  });

  setRequests(enriched);
};

  // 🔥 Filter + Search + Sort
  let filtered = requests;

// 🔥 filter by type
if (filter !== "All") {
  filtered = filtered.filter((r) => {
    if (filter === "Leave Request") return r.type === "leave";
    if (filter === "Shift Swap") return r.type === "shift";
    if (filter === "Off Swap") return r.type === "off";
    return true;
  });
}

  // search
  if (search) {
    filtered = filtered.filter((r) =>
      r.user?.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.target?.full_name?.toLowerCase().includes(search.toLowerCase())
    );
  }

  // sort
  filtered = filtered.sort((a, b) =>
    sort === "new"
      ? new Date(b.date) - new Date(a.date)
      : new Date(a.date) - new Date(b.date)
  );

  const getDay = (date) =>
    new Date(date).toLocaleDateString("en-US", { weekday: "short" });

  return (
    <div style={styles.container}>

      {/* 🔙 Back */}
      <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
        ← Back to Dashboard
      </button>

      {/* 🔥 Controls */}
      <div style={styles.topBar}>

  {/* 👈 فاضي علشان يوازن الgrid */}
  <div></div>

  {/* 🎯 Filters في النص */}
  <div style={styles.filters}>
    {["All", "Leave Request", "Shift Swap", "Off Swap"].map((f) => (
      <button
        key={f}
        style={styles.filterBtn(filter === f)}
        onClick={() => setFilter(f)}
      >
        {f}
      </button>
    ))}
  </div>

  {/* 👉 Search + Sort على اليمين */}
  <div style={styles.rightControls}>
    <input
      placeholder="🔍 Search by name..."
      style={styles.search}
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />

    <select
      style={styles.sort}
      value={sort}
      onChange={(e) => setSort(e.target.value)}
    >
      <option value="new">Newest</option>
      <option value="old">Oldest</option>
    </select>
  </div>
  </div>

      {/* 🔥 Table */}
<div style={styles.table}>

  <div style={styles.headerRow}>
    <span>HR ID</span>
    <span>Name</span>
    <span>Target</span>
    <span>Date</span>
    <span>Day</span>
    <span>Type</span>
    <span>Status</span>
  </div>

  {filtered.map((r) => (
    <div key={r.id} style={styles.row}>

      {/* ✅ الجديد */}
      <span>{r.user_hr || "-"}</span>
      <span>{r.user_name || "-"}</span>

      <span>{r.target_name || "-"}</span>

      <span>{r.date}</span>
      <span>{getDay(r.date)}</span>

      <span>
        {r.type === "leave" ? r.sub_type : r.type}
      </span>

      <span style={styles.status(r.status)}>
        {r.status}
      </span>

    </div>
  ))}

</div>

    </div>
  );
}

//////////////////////////////////////////////////
// 🎨 STYLES (NEON PREMIUM)
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

  topBar: {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  marginBottom: "25px",
},

  filters: {
  display: "flex",
  justifyContent: "center",
  gap: "15px",
},

  filterBtn: (active) => ({
  padding: "10px 22px", // 🔥 أوسع
  borderRadius: "12px",
  border: "1px solid #00f0ff",
  background: active ? "#00f0ff" : "transparent",
  color: active ? "#000" : "#00f0ff",
  cursor: "pointer",
  boxShadow: "0 0 10px #00f0ff55",
  transition: "0.3s",
  fontSize: "15px",
}),

  search: {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #00f0ff",
    background: "#020617",
    color: "#fff",
    outline: "none",
  },

  sort: {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #00f0ff",
    background: "#020617",
    color: "#fff",
  },

  table: {
    border: "1px solid #00f0ff",
  },

  headerRow: {
    display: "grid",
    gridTemplateColumns: "repeat(7,1fr)",
    borderBottom: "1px solid #00f0ff",
    padding: "10px",
    fontWeight: "bold",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "repeat(7,1fr)",
    padding: "10px",
    borderBottom: "1px solid #00f0ff33",
    transition: "0.2s",
  },

  status: (status) => ({
    color:
      status === "Approved"
        ? "#22c55e"
        : status === "Rejected"
        ? "#ef4444"
        : "#facc15",
    fontWeight: "bold",
  }),
  rightControls: {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
},
};

export default MyRequests;