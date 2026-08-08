import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

const sheetID = "1JcJ4I6suMe5fWatvOhhiYiNvLA3aqsxjAGNzygbvqOY";
const scheduleSheetID = "1NdHIirHap0hRk1qcbKzEnCsLMxNVfUmW73YG9xoiacM";

function TLAttendance() {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  ////////////////////////////////////////////
  // FETCH
  ////////////////////////////////////////////
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: leaderProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const { data: team } = await supabase
        .from("profiles")
        .select("full_name, hr_id")
        .eq("leader_id", leaderProfile.full_name)
        .eq("role", "agent");

      const teamList = team || [];
      setTeamMembers(teamList);

      const teamHRIDs = teamList.map((m) =>
        String(m.hr_id).trim()
      );

      const res = await fetch(
        `https://opensheet.elk.sh/${sheetID}/Attendance`
      );
      const sheetData = await res.json();

      setData(Array.isArray(sheetData) ? sheetData : []);

      const resLeaves = await fetch(
        `https://opensheet.elk.sh/${scheduleSheetID}/Leaves Table`
      );
      const leavesData = await resLeaves.json();

      const filteredLeaves = leavesData.filter((r) =>
        teamHRIDs.includes(String(r["HR ID"]).trim())
      );

      setTeamLeaves(filteredLeaves);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  ////////////////////////////////////////////
  // FILTER
  ////////////////////////////////////////////
  const filteredData = useMemo(() => {
    if (!teamMembers.length || !data.length) return [];

    let result = [];

    teamMembers.forEach((member) => {
      const rows = data.filter(
        (r) =>
          String(r["HR ID"]).trim() ===
          String(member.hr_id).trim()
      );

      rows.forEach((row) => {
        result.push({
          ...row,
          agentName: member.full_name,
        });
      });
    });

    if (search) {
      result = result.filter(
        (r) =>
          r.agentName
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          String(r["HR ID"]).includes(search)
      );
    }

    if (selectedDate) {
      result = result.filter((r) => r.Date === selectedDate);
    }

    if (selectedShift) {
      result = result.filter((r) => r.Shift === selectedShift);
    }

    return result;
  }, [data, teamMembers, search, selectedDate, selectedShift]);

  ////////////////////////////////////////////
  // SORT
  ////////////////////////////////////////////
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) =>
      sortAsc
        ? new Date(a.Date) - new Date(b.Date)
        : new Date(b.Date) - new Date(a.Date)
    );
  }, [filteredData, sortAsc]);

  ////////////////////////////////////////////
  // KPIs
  ////////////////////////////////////////////
  const cleanPercent = (val) =>
    parseFloat(String(val || "").replace("%", "")) || 0;

  const avgConf =
    sortedData.reduce(
      (a, r) => a + cleanPercent(r.Conformance),
      0
    ) / (sortedData.length || 1);

  const avgAdh =
    sortedData.reduce(
      (a, r) => a + cleanPercent(r.Adherence),
      0
    ) / (sortedData.length || 1);

  const totalTardy = sortedData.reduce(
    (sum, r) => sum + (+r["Tardy Minutes"] || 0),
    0
  );

  const teamSize = teamMembers.length;

  ////////////////////////////////////////////
  // LEAVES
  ////////////////////////////////////////////
  const sumLeaves = (key) =>
    teamLeaves.reduce((acc, r) => acc + (+r[key] || 0), 0);

  const totalAnnual = sumLeaves("Annual");
  const totalCasual = sumLeaves("Casual");
  const totalNoShow = sumLeaves("No Show");
  const totalUPL = sumLeaves("UPL");
  const totalSick = sumLeaves("Sick");

  ////////////////////////////////////////////
  // EXPORT
  ////////////////////////////////////////////
  const exportToExcel = () => {
    const headers = ["HR ID", "Name", "Date", "Shift"];

    const rows = sortedData.map((r) => [
      r["HR ID"],
      r.agentName,
      r.Date,
      r.Shift,
    ]);

    let csv =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "Team_Attendance.csv";
    link.click();
  };

  if (loading) return <h2 style={styles.loading}>Loading...</h2>;

  ////////////////////////////////////////////
  return (
    <div style={styles.container}>
      {/* TOP */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back to Dashboard
        </button>

        <div style={styles.tools}>
          <input
            style={styles.input}
            placeholder="Search"
            onChange={(e) => setSearch(e.target.value)}
          />

          <select style={styles.input} onChange={(e) => setSelectedDate(e.target.value)}>
            <option value="">All Dates</option>
            {[...new Set(data.map((r) => r.Date))].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          <select style={styles.input} onChange={(e) => setSelectedShift(e.target.value)}>
            <option value="">All Shifts</option>
            {[...new Set(data.map((r) => r.Shift))].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <button style={styles.btn} onClick={() => setSortAsc(!sortAsc)}>
            Sort
          </button>

          <button style={styles.exportBtn} onClick={exportToExcel}>
            Export
          </button>
        </div>
      </div>

      <h2 style={styles.title}>My Team Attendance 📊</h2>

      <div style={styles.layout}>
        {/* LEFT */}
        <div style={styles.panel}>
          <KPI title="Team Size" value={teamSize} />
          <KPI title="Total Tardy" value={totalTardy} />
          <KPI title="Avg Conf" value={avgConf.toFixed(2)} />
          <KPI title="Avg Adh" value={avgAdh.toFixed(2)} />
        </div>

        {/* TABLE */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>HR ID</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Shift</th>
                <th style={styles.th}>Login</th>
                <th style={styles.th}>Logout</th>
                <th style={styles.th}>Tardy</th>
                <th style={styles.th}>Conf</th>
                <th style={styles.th}>Adh</th>
              </tr>
            </thead>

            <tbody>
              {sortedData.map((r, i) => (
                <tr key={i} style={styles.row}>
                  <td style={styles.td}>{r["HR ID"]}</td>
                  <td style={styles.td}>{r.agentName}</td>
                  <td style={styles.td}>{r.Date}</td>
                  <td style={styles.td}>{r.Shift}</td>
                  <td style={styles.td}>{r["First Login"]}</td>
                  <td style={styles.td}>{r["Last Logout"]}</td>
                  <td style={styles.td}>{r["Tardy Minutes"]}</td>
                  <td style={styles.percent}>{r.Conformance}</td>
                  <td style={styles.percent}>{r.Adherence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RIGHT */}
        <div style={styles.panel}>
          <KPI title="Annual" value={totalAnnual} />
          <KPI title="Casual" value={totalCasual} />
          <KPI title="No Show" value={totalNoShow} />
          <KPI title="UPL" value={totalUPL} />
          <KPI title="Sick" value={totalSick} />
        </div>
      </div>
    </div>
  );
}

const KPI = ({ title, value }) => (
  <div style={styles.kpi}>
    <div>{title}</div>
    <div style={styles.kpiValue}>{value}</div>
  </div>
);

////////////////////////////////////////////////
// STYLES 🔥🔥🔥
////////////////////////////////////////////////
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a)",
    padding: "20px",
    color: "#fff",
    fontFamily: "Calibri",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },

  backBtn: {
    border: "1px solid #00f0ff",
    padding: "10px",
    background: "transparent",
    color: "#00f0ff",
    borderRadius: "10px",
    cursor: "pointer",
  },

  tools: {
    display: "flex",
    gap: "10px",
  },

  input: {
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #00f0ff",
    background: "#020617",
    color: "#00f0ff",
  },

  btn: {
    border: "1px solid #00f0ff",
    padding: "8px",
    background: "transparent",
    color: "#00f0ff",
    borderRadius: "8px",
    cursor: "pointer",
  },

  exportBtn: {
    border: "1px solid #22c55e",
    color: "#22c55e",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  title: {
    textAlign: "center",
    color: "#00f0ff",
    textShadow: "0 0 10px #00f0ff",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "160px 1fr 160px",
    gap: "20px",
  },

  panel: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  kpi: {
    border: "1px solid #00f0ff",
    padding: "10px",
    borderRadius: "10px",
    textAlign: "center",
    boxShadow: "0 0 10px #00f0ff55",
  },

  kpiValue: {
    marginTop: "8px",
    color: "#22c55e",
    fontWeight: "bold",
  },

  tableWrapper: {
    border: "1px solid #00f0ff",
    borderRadius: "10px",
    padding: "10px",
    height: "80vh",
    overflow: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    padding: "12px",
    color: "#00eaff",
    borderBottom: "2px solid #00eaff",
    textAlign: "center",
  },

  td: {
    padding: "10px",
    textAlign: "center",
    borderBottom: "1px solid #ffffff10",
  },

  row: {
    transition: "0.3s",
  },

  percent: {
    color: "#22c55e",
    fontWeight: "bold",
    textAlign: "center",
  },

  loading: {
    textAlign: "center",
    marginTop: "100px",
  },
};

export default TLAttendance;