import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function AllRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  

  useEffect(() => {
  fetchRequests();

  const channel = supabase
    .channel("realtime-requests")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "requests",
      },
      (payload) => {
        console.log("Realtime update:", payload);
        fetchRequests();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  //////////////////////////////////////
  // Fetch Requests
  //////////////////////////////////////
  const fetchRequests = async () => {
    const { data: requestsData } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*");

    const profilesMap = {};

    profilesData?.forEach((p) => {
      profilesMap[p.id] = p;
    });

    setProfiles(profilesMap);
    setRequests(requestsData || []);
  };

  //////////////////////////////////////
  // Filter Logic
  //////////////////////////////////////
  useEffect(() => {
    let result = [...requests];

    // type filter
    if (filterType !== "all") {
      result = result.filter(
        (r) => r.type === filterType
      );
    }

    // search by name
    if (search) {
      result = result.filter((r) => {
        const user = profiles[r.user_id];

        return user?.full_name
          ?.toLowerCase()
          .includes(search.toLowerCase());
      });
    }

    // sorting
    result.sort((a, b) =>
      sortOrder === "newest"
        ? new Date(b.created_at) -
          new Date(a.created_at)
        : new Date(a.created_at) -
          new Date(b.created_at)
    );

    setFiltered(result);
  }, [
    requests,
    filterType,
    search,
    sortOrder,
    profiles,
  ]);

  const getStatus = (shift) => {
  if (!shift) return "OFF";

  const offTypes = ["OFF", "Annual", "Casual", "Sick", "UPL", "Holiday"];

  return offTypes.includes(shift) ? "OFF" : "WORK";
};

  //////////////////////////////////////
  // Final Admin Decision
  //////////////////////////////////////
  const updateStatus = async (request, finalStatus) => {
  const { id, type, user_id, target_user_id, date } = request;

  // 1. Update request
  await supabase
    .from("requests")
    .update({
      status: finalStatus,
      admin_status: finalStatus,
    })
    .eq("id", id);

   // 🔔 Notification
await supabase
  .from("notifications")
  .insert([
    {
      user_id: user_id,

      title:
        finalStatus === "Approved"
          ? "Request Approved"
          : "Request Rejected",

      message:
        finalStatus === "Approved"
          ? "Your request has been approved by Admin."
          : "Your request has been rejected by Admin.",

      type:
        finalStatus === "Approved"
          ? "success"
          : "error",

      is_read: false,
    },
  ]); 

  // 2. لو Approved → نعدل schedule
  if (finalStatus === "Approved") {

    //////////////////////////////////////
    // LEAVE
    //////////////////////////////////////
  if (type?.toLowerCase() === "leave") {

  const newShift = request.sub_type || "Annual";

  const { data, error } = await supabase
  .from("schedule")
  .upsert(
    {
      user_id: user_id,
      date: new Date(date).toISOString().split("T")[0],
      shift: newShift,
      status: getStatus(newShift),
    },
    { onConflict: "user_id,date" }
  );

  console.log("UPSERT RESULT:", data);
  console.log("UPSERT ERROR:", error);
}

    //////////////////////////////////////
    // SHIFT SWAP
    //////////////////////////////////////
    if (type === "shift") {
      const { data: userShift } = await supabase
        .from("schedule")
        .select("*")
        .eq("user_id", user_id)
        .eq("date", date)
        .single();

      const { data: targetShift } = await supabase
        .from("schedule")
        .select("*")
        .eq("user_id", target_user_id)
        .eq("date", date)
        .single();

      if (userShift && targetShift) {
        await supabase
          .from("schedule")
          .update({
            shift: targetShift.shift,
            status: getStatus(targetShift.shift),})
          .eq("id", userShift.id);

        await supabase
          .from("schedule")
          .update({
            shift: userShift.shift,
            status: getStatus(userShift.shift),})
          .eq("id", targetShift.id);
      }
    }
//////////////////////////////////////
// OFF SWAP (FIXED)
//////////////////////////////////////
if (type === "off") {

  // 🧠 يوم الأوف بتاع الأول
  const myOffDate = request.target_date;

  // 🧠 يوم الأوف بتاع التاني
  const targetOffDate = request.date;

  // 🧠 هات شيفت طبيعي للأول
const { data: userWorkShift } = await supabase
  .from("schedule")
  .select("shift")
  .eq("user_id", user_id)
  .eq("status", "WORK")
  .limit(1)
  .single();

// 🧠 هات شيفت طبيعي للتاني
const { data: targetWorkShift } = await supabase
  .from("schedule")
  .select("shift")
  .eq("user_id", target_user_id)
  .eq("status", "WORK")
  .limit(1)
  .single();

  //////////////////////////////////////
  // 1. الأول يشيل OFF من يومه القديم
  //////////////////////////////////////
  await supabase
    .from("schedule")
    .update({
      shift: userWorkShift?.shift || "09:00-18:00",
      status: "WORK",
    })
    .eq("user_id", user_id)
    .eq("date", myOffDate);

  //////////////////////////////////////
  // 2. الأول ياخد OFF يوم التاني
  //////////////////////////////////////
  await supabase
    .from("schedule")
    .update({
      shift: "OFF",
      status: "OFF",
    })
    .eq("user_id", user_id)
    .eq("date", targetOffDate);

  //////////////////////////////////////
  // 3. التاني يشيل OFF من يومه
  //////////////////////////////////////
  await supabase
    .from("schedule")
    .update({
      shift: targetWorkShift?.shift || "09:00-18:00",
      status: "WORK",
    })
    .eq("user_id", target_user_id)
    .eq("date", targetOffDate);

  //////////////////////////////////////
  // 4. التاني ياخد OFF يوم الأول
  //////////////////////////////////////
  await supabase
    .from("schedule")
    .update({
      shift: "OFF",
      status: "OFF",
    })
    .eq("user_id", target_user_id)
    .eq("date", myOffDate);
}}

console.log("FINAL STATUS:", finalStatus);
console.log("TYPE:", type);

  fetchRequests();
};

return (
    <div style={styles.container}>
      
      {/* Top */}
      <div style={styles.topBar}>
        <button
          style={styles.backBtn}
          onClick={() =>
            navigate("/admin-dashboard")
          }
        >
          ← Back to Dashboard
        </button>

        <h1 style={styles.title}>
          Company Requests 📩
        </h1>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.filterBtns}>
          {[
            "all",
            "leave",
            "shift",
            "off",
          ].map((type) => (
            <button
              key={type}
              style={{
                ...styles.filterBtn,
                background:
                  filterType === type
                    ? "#00f0ff"
                    : "transparent",
                color:
                  filterType === type
                    ? "#000"
                    : "#00f0ff",
              }}
              onClick={() =>
                setFilterType(type)
              }
            >
              {type}
            </button>
          ))}
        </div>

        <div style={styles.rightFilters}>
          <input
            type="text"
            placeholder="Search name..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            style={styles.search}
          />

          <select
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(
                e.target.value
              )
            }
            style={styles.select}
          >
            <option value="newest">
              Newest
            </option>
            <option value="oldest">
              Oldest
            </option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={styles.table}>
        <div style={styles.headerRow}>
          <span>ٌRequester</span>
          <span>Date</span>
          <span>Target</span>
          <span>Target Date</span>
          <span>Type</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {filtered.map((r) => {
          const user =
            profiles[r.user_id];

          const target =
            profiles[
              r.target_user_id
            ];

          return (
            <div
              key={r.id}
              style={styles.row}>
              <span>{user?.full_name || "-"}</span>
              <span>{r.date}</span>              
              <span>{target?.full_name || "-"}</span>
              <span>{r.target_date || "-"}</span>
              <span>
                    {r.type === "leave"
                    ? r.sub_type
                    : r.type}
              </span>
              <span style={{color:r.status ==="Approved"? "#22c55e": r.status ==="Rejected"? "#ef4444": "#facc15",fontWeight: "bold",}}>{r.status}</span>

              {/* FIXED ACTION LOGIC */}
              <div style={styles.actionBtns}>
                {r.status ===
                  "Waiting for Admin Response" &&
                r.admin_status ===
                  "Pending" ? (
                  <>
                    <button
                      style={
                        styles.approveBtn
                      }
                      onClick={() =>
                        updateStatus(
                          r,
                          "Approved"
                        )
                      }
                    >
                      Approve
                    </button>

                    <button
                      style={
                        styles.rejectBtn
                      }
                      onClick={() =>
                        updateStatus(
                          r,
                          "Rejected"
                        )
                      }
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <span
                    style={{
                      color:
                        r.admin_status ===
                        "Approved"
                          ? "#22c55e"
                          : "#ef4444",
                      fontWeight:
                        "bold",
                    }}
                  >
                    Finalized
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AllRequests;

//////////////////////////////////////////////////
// Styles
//////////////////////////////////////////////////

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#020617,#0f172a)",
    color: "#fff",
    padding: "30px",
    fontFamily:
      "Comic Sans MS",
  },

  topBar: {
    display: "flex",
    justifyContent:
      "space-between",
    marginBottom: "25px",
  },

  title: {
    color: "#00f0ff",
  },

  backBtn: {
    border: "1px solid #00f0ff",
    background: "transparent",
    color: "#00f0ff",
    padding: "8px 15px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  filters: {
    display: "flex",
    justifyContent:
      "space-between",
    marginBottom: "25px",
    flexWrap: "wrap",
    gap: "20px",
  },

  filterBtns: {
    display: "flex",
    gap: "10px",
  },

  filterBtn: {
    border: "1px solid #00f0ff",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  rightFilters: {
    display: "flex",
    gap: "10px",
  },

  search: {
    padding: "10px",
    border: "1px solid #00f0ff",
    background: "transparent",
    color: "#fff",
    borderRadius: "10px",
  },

  select: {
    padding: "10px",
    border: "1px solid #00f0ff",
    background: "transparent",
    color: "#fff",
    borderRadius: "10px",
  },

  table: {
    border: "1px solid #00f0ff",
    borderRadius: "10px",
  },

  headerRow: {
    display: "grid",
    gridTemplateColumns:"2fr 2fr 1.2fr 1.2fr 1fr 1fr 2fr",
    padding: "15px",
    color: "#00f0ff",
    fontWeight: "bold",
  },

  row: {
    display: "grid",
    gridTemplateColumns:"2fr 2fr 1.2fr 1.2fr 1fr 1fr 2fr",
    padding: "15px",
    borderTop: "1px solid #ffffff11",
    alignItems: "center",
  },

  actionBtns: {
    display: "flex",
    gap: "10px",
  },

  approveBtn: {
    background: "#22c55e",
    border: "none",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  rejectBtn: {
    background: "#ef4444",
    border: "none",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};