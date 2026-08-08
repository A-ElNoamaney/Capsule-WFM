import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function CompanySchedule() {
  const navigate = useNavigate();

  const [scheduleData, setScheduleData] = useState([]);
  const [breakData, setBreakData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("schedule");
  const [search, setSearch] = useState("");

  ////////////////////////////////////////////
  // Fetch Data
  ////////////////////////////////////////////
  const fetchCompanySchedule = async () => {
    console.log("🔥 FETCH RUNNING");

    const { data: schedule, error: e1 } = await supabase
      .from("schedule")
      .select("*");

    const { data: breaks, error: e2 } = await supabase
      .from("breaks")
      .select("*");

    const { data: profiles, error: e3 } = await supabase
      .from("profiles")
      .select("*");

    console.log("SCHEDULE:", schedule);
    console.log("BREAKS:", breaks);
    console.log("PROFILES:", profiles);

    if (e1 || e2 || e3) {
      console.log("ERROR:", e1 || e2 || e3);
      setLoading(false);
      return;
    }

    //////////////////////////////////////
    // RESHAPE SCHEDULE
    //////////////////////////////////////
    const grouped = {};

    schedule.forEach((row) => {
      if (!grouped[row.user_id]) {
        const profile = profiles.find(
          (p) => p.id === row.user_id
        );

        grouped[row.user_id] = {
          "HR ID": profile?.hr_id,
          Name: profile?.full_name,
          Leader: profile?.leader_id,
        };
      }

      const formattedDate = new Date(row.date).toLocaleDateString(
        "en-US",
        {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      );

      grouped[row.user_id][formattedDate] = row.shift;
    });

    //////////////////////////////////////
    // RESHAPE BREAKS (ربط بـ HR ID)
    //////////////////////////////////////
    const breaksMap = {};

    breaks.forEach((b) => {
      const profile = profiles.find(
        (p) => p.id === b.user_id
      );

      if (!profile) return;

      breaksMap[profile.hr_id] = {
        "Break 1 (15 Min)": b.break1,
        "Break 2 (30 Min)": b.break2,
        "Break 3 (15 Min)": b.break3,
      };
    });

    setScheduleData(Object.values(grouped));
    setBreakData(breaksMap);
    setLoading(false);
  };

  useEffect(() => {
  fetchCompanySchedule();

  const channel = supabase
    .channel("schedule-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "schedule",
      },
      (payload) => {
        console.log("🔴 CHANGE:", payload);

        // نعمل refresh
        fetchCompanySchedule();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  ////////////////////////////////////////////
  // Get Breaks
  ////////////////////////////////////////////
  const getEmployeeBreaks = (hrId) => {
    return breakData[hrId];
  };

  ////////////////////////////////////////////
  // Days Dynamic
  ////////////////////////////////////////////
 const days = [
  ...new Set(
    scheduleData.flatMap((emp) =>
      Object.keys(emp).filter((k) =>
        k.includes(",")
      )
    )
  ),
].sort(
  (a, b) => new Date(a) - new Date(b)
);

  ////////////////////////////////////////////
  // Search
  ////////////////////////////////////////////
  const filteredSchedule = scheduleData.filter((employee) =>
    employee["Name"]
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  ////////////////////////////////////////////
  // Loading
  ////////////////////////////////////////////
  if (loading) {
    return (
      <div style={styles.loading}>
        Loading...
      </div>
    );
  }
  const getShiftStyle = (shift) => {
  if (!shift || shift === "-") return {};

  if (shift === "OFF") {
  return {
    color: "#ef4444",
    background: "#ef444422",
    fontWeight: "bold",
  };
}

  const leaveTypes = ["Annual", "Casual", "Sick", "UPL", "Holiday"];

  if (leaveTypes.includes(shift)) {
    return { color: "#eab308", fontWeight: "bold" }; // 🟡
  }

  return { color: "#22c55e", fontWeight: "bold" }; // 🟢 WORK
};

  return (
    <div style={styles.container}>
      {/* Top Bar */}
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
          Company Schedule 📅
        </h1>

        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={styles.searchInput}
        />
      </div>

      {/* Toggle */}
      <div style={styles.toggleContainer}>
        <button
          style={{
            ...styles.toggleBtn,
            background:
              activeView === "schedule"
                ? "#00f0ff"
                : "transparent",
            color:
              activeView === "schedule"
                ? "#000"
                : "#00f0ff",
          }}
          onClick={() =>
            setActiveView("schedule")
          }
        >
          Schedule
        </button>

        <button
          style={{
            ...styles.toggleBtn,
            background:
              activeView === "breaks"
                ? "#00f0ff"
                : "transparent",
            color:
              activeView === "breaks"
                ? "#000"
                : "#00f0ff",
          }}
          onClick={() =>
            setActiveView("breaks")
          }
        >
          Breaks
        </button>
      </div>

      {/* Schedule */}
      {activeView === "schedule" && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.headerCell}>
                  HR ID
                </th>
                <th style={styles.headerCell}>
                  Name
                </th>
                <th style={styles.headerCell}>
                  Leader
                </th>

                {days.map((day) => (
                  <th key={day} style={styles.headerCell}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredSchedule.map((emp, i) => (
                <tr key={i}>
                  <td style={styles.cell}>
                    {emp["HR ID"]}
                  </td>
                  <td style={styles.cell}>
                    {emp["Name"]}
                  </td>
                  <td style={styles.cell}>
                    {emp["Leader"]}
                  </td>

                  {days.map((d) => (
                    <td
                      key={d}
                      style={{
                      ...styles.cell,
                      ...getShiftStyle(emp[d]), }}>
                     {emp[d] || "-"}
                     </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Breaks */}
      {activeView === "breaks" && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.headerCell}>
                  HR ID
                </th>
                <th style={styles.headerCell}>
                  Name
                </th>
                <th style={styles.headerCell}>
                  Leader
                </th>
                <th style={styles.headerCell}>
                  Break 1
                </th>
                <th style={styles.headerCell}>
                  Break 2
                </th>
                <th style={styles.headerCell}>
                  Break 3
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSchedule.map((emp, i) => {
                const b = getEmployeeBreaks(
                  emp["HR ID"]
                );

                return (
                  <tr key={i}>
                    <td style={styles.cell}>
                      {emp["HR ID"]}
                    </td>
                    <td style={styles.cell}>
                      {emp["Name"]}
                    </td>
                    <td style={styles.cell}>
                      {emp["Leader"]}
                    </td>
                    <td style={styles.cell}>
                      {b?.["Break 1 (15 Min)"] ||
                        "-"}
                    </td>
                    <td style={styles.cell}>
                      {b?.["Break 2 (30 Min)"] ||
                        "-"}
                    </td>
                    <td style={styles.cell}>
                      {b?.["Break 3 (15 Min)"] ||
                        "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CompanySchedule;

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

  loading: {
    textAlign: "center",
    marginTop: "100px",
    fontSize: "24px",
    color: "#00f0ff",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  title: {
    color: "#00f0ff",
    fontSize: "42px",
    textAlign: "center",
  },

  backBtn: {
    border: "1px solid #00f0ff",
    background: "transparent",
    color: "#00f0ff",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    boxShadow: "0 0 10px #00f0ff55",
  },

  searchInput: {
    padding: "12px",
    width: "220px",
    border: "1px solid #00f0ff",
    background: "transparent",
    color: "#fff",
    borderRadius: "10px",
    outline: "none",
  },

  toggleContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    marginBottom: "30px",
  },

  toggleBtn: {
    padding: "12px 25px",
    border: "1px solid #00f0ff",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "0.3s",
  },

  tableWrapper: {
    border: "1px solid #00f0ff",
    borderRadius: "10px",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  headerCell: {
    padding: "15px",
    border: "1px solid #ffffff65",
    color: "#00f0ff",
    textAlign: "center",
    fontWeight: "bold",
  },

  cell: {
    padding: "15px",
    border: "1px solid #ffffff65",
    textAlign: "center",
  },
};