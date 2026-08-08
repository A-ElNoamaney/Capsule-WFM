import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function TLRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("new");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // current TL
      const { data: leaderProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // team members
      const { data: teamMembers } = await supabase
        .from("profiles")
        .select("id, full_name, hr_id")
        .ilike("leader_id", leaderProfile.full_name)
        .eq("role", "agent");

      if (!teamMembers?.length) {
        setRequests([]);
        return;
      }

      const teamIds = teamMembers.map((m) => m.id);

      // requests
      const { data: requestsData } = await supabase
        .from("requests")
        .select("*")
        .in("user_id", teamIds)
        .order("created_at", {
         ascending: false,
      });

      const enriched = await Promise.all(
  requestsData.map(async (r) => {
        const requester = teamMembers.find(
          (m) => m.id === r.user_id
        );

        const { data: targetProfile } = await supabase
  .from("profiles")
  .select("full_name")
  .eq("id", r.target_user_id)
  .single();

return {
  ...r,
  requester_name: requester?.full_name || "-",
  requester_hr: requester?.hr_id || "-",
  target_name: targetProfile?.full_name || "-",
};
      })
);

      setRequests(enriched);

    } catch (error) {
      console.log(error);
    }
  };

  //////////////////////////////////////
  // TL APPROVE
  //////////////////////////////////////
  const approveRequest = async (id) => {

  // 🧠 هات بيانات الريكوست
  const { data: requestData } = await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .single();

  // ✅ Update Request
  await supabase
    .from("requests")
    .update({
      status: "Waiting Admin Response",
      admin_status: "Pending",
    })
    .eq("id", id);

  // 🔔 Notification
  await supabase
    .from("notifications")
    .insert([
      {
        user_id: requestData.user_id,

        title: "Request Sent To Admin",

        message:
          "Your request was approved by TL and waiting for Admin response.",

        type: "success",

        is_read: false,
      },
    ]);

  fetchRequests();
};
  //////////////////////////////////////
  // TL REJECT
  //////////////////////////////////////
  const rejectRequest = async (id) => {

  // 🧠 هات بيانات الريكوست
  const { data: requestData } = await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .single();

  // ❌ Reject Request
  await supabase
    .from("requests")
    .update({
      status: "Rejected",
      admin_status: "Rejected",
    })
    .eq("id", id);

  // 🔔 Notification
  await supabase
    .from("notifications")
    .insert([
      {
        user_id: requestData.user_id,

        title: "Request Rejected",

        message:
          "Your request has been rejected by Team Leader.",

        type: "error",

        is_read: false,
      },
    ]);

  fetchRequests();
};

  //////////////////////////////////////
  // FILTER + SEARCH + SORT
  //////////////////////////////////////
  let filtered =
    filter === "All"
      ? requests
      : requests.filter((r) => r.type === filter);

  // search
  filtered = filtered.filter((r) =>
    r.requester_name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  // sort
  filtered.sort((a, b) =>
    sort === "new"
      ? new Date(b.date) - new Date(a.date)
      : new Date(a.date) - new Date(b.date)
  );

  return (
    <div style={styles.container}>
      
      {/* Back */}
      <button
        style={styles.backBtn}
        onClick={() => navigate("/dashboard")}
      >
        ← Back to Dashboard
      </button>

      <h2 style={styles.title}>
        My Approvals 👨‍💼
      </h2>

      {/* Top Controls */}
      <div style={styles.topBar}>
        <div></div>

        {/* Filters */}
        <div style={styles.filters}>
          {["All", "leave", "shift", "off"].map(
            (f) => (
              <button
                key={f}
                style={styles.filterBtn(
                  filter === f
                )}
                onClick={() =>
                  setFilter(f)
                }
              >
                {f === "leave"
                  ? "Leave"
                  : f === "shift"
                  ? "Shift Swap"
                  : f === "off"
                  ? "Off Swap"
                  : "All"}
              </button>
            )
          )}
        </div>

        {/* Search + Sort */}
        <div style={styles.rightControls}>
          <input
            placeholder="🔍 Search by name..."
            style={styles.search}
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <select
            style={styles.sort}
            value={sort}
            onChange={(e) =>
              setSort(e.target.value)
            }
          >
            <option value="new">
              Newest
            </option>
            <option value="old">
              Oldest
            </option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={styles.table}>
        <div style={styles.headerRow}>
          <span>Requester HR ID</span>
          <span>Requester</span>
          <span>Requester Date</span>
          <span>Target</span>
          <span>Target Date</span>
          <span>Type</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {filtered.map((r) => (
          <div
            key={r.id}
            style={styles.row}
          >
            <span>{r.requester_hr}</span>

            <span>{r.requester_name}</span>

            <span>{r.date}</span>

            <span>{r.target_name}</span>

            <span>{r.target_date || "-"}</span>

            <span>{r.type === "leave"
                ? r.sub_type
                : r.type}
            </span>

            <span style={styles.status(r.status)}>
              {r.status}
            </span>

            <span>
              {r.status === "Pending" && (
                <>
                  <button
                    style={styles.approveBtn}
                    onClick={() =>
                      approveRequest(r.id)
                    }
                  >
                    Approve
                  </button>

                  <button
                    style={styles.rejectBtn}
                    onClick={() =>
                      rejectRequest(r.id)
                    }
                  >
                    Reject
                  </button>
                </>
              )}

              {r.status ===
                "Waiting Admin Response" && (
                <span style={{ color: "#facc15" }}>
                  Waiting Admin
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TLRequests;

//////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#020617,#0f172a)",
    color: "#fff",
    padding: "30px",
    fontFamily: "Comic Sans MS",
  },

  title: {
    textAlign: "center",
    color: "#00f0ff",
    marginBottom: "25px",
  },

  backBtn: {
    padding: "10px 20px",
    border: "1px solid #00f0ff",
    background: "transparent",
    color: "#00f0ff",
    borderRadius: "10px",
    cursor: "pointer",
    boxShadow:
      "0 0 10px #00f0ff55",
    marginBottom: "20px",
  },

  topBar: {
    display: "grid",
    gridTemplateColumns:
      "1fr auto 1fr",
    alignItems: "center",
    marginBottom: "25px",
  },

  filters: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
  },

  filterBtn: (active) => ({
    padding: "12px 22px",
    borderRadius: "12px",
    border: "1px solid #00f0ff",
    background: active
      ? "#00f0ff"
      : "transparent",
    color: active
      ? "#000"
      : "#00f0ff",
    cursor: "pointer",
    boxShadow: active
      ? "0 0 20px #00f0ff"
      : "0 0 10px #00f0ff55",
  }),

  rightControls: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },

  search: {
    padding: "12px",
    width: "220px",
    borderRadius: "10px",
    border: "1px solid #00f0ff",
    background: "transparent",
    color: "#fff",
  },

  sort: {
    padding: "12px",
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
    gridTemplateColumns: "0.7fr 1fr 1fr 1fr 1fr 1fr 1fr 1.2fr",
    padding: "15px",
    borderBottom: "1px solid #202727",
    color: "#00f0ff",
    fontWeight: "bold",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "0.7fr 1fr 1fr 1fr 1fr 1fr 1fr 1.2fr",
    padding: "15px",
    borderBottom: "1px solid #ffffff22",
    alignItems: "center",
  },

  status: (status) => ({
    color:
      status === "Approved"
        ? "#22c55e"
        : status === "Rejected"
        ? "#ef4444"
        : status === "Waiting for Admin Response"
        ? "#facc15"
        : "#00f0ff",
    fontWeight: "bold",
  }),

  approveBtn: {
    background: "#22c55e",
    border: "none",
    color: "#fff",
    padding: "6px 12px",
    marginRight: "5px",
    cursor: "pointer",
    borderRadius: "6px",
  },

  rejectBtn: {
    background: "#ef4444",
    border: "none",
    color: "#fff",
    padding: "6px 12px",
    cursor: "pointer",
    borderRadius: "6px",
  },
};