import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

const sheetID = "1JcJ4I6suMe5fWatvOhhiYiNvLA3aqsxjAGNzygbvqOY";
const scheduleSheetID = "1NdHIirHap0hRk1qcbKzEnCsLMxNVfUmW73YG9xoiacM";

function AgentAttendance() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [leaves, setLeaves] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  //eslint-disable-next-line
  const [selectedNote, setSelectedNote] = useState("");

  /////////////////////////////////////////////
  // FETCH DATA
  /////////////////////////////////////////////
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: profile } = await supabase
        .from("profiles")
        .select("hr_id")
        .eq("id", user.id)
        .single();

      // Attendance
      const res = await fetch(
        `https://opensheet.elk.sh/${sheetID}/Attendance`
      );
      const json = await res.json();

      const filtered = Array.isArray(json)
        ? json.filter(
            (r) =>
              String(r["HR ID"]).trim() ===
              String(profile.hr_id).trim()
          )
        : [];

      setData(filtered);

      // Leaves
      const resLeaves = await fetch(
        `https://opensheet.elk.sh/${scheduleSheetID}/Leaves Table`
      );
      const leavesData = await resLeaves.json();

      if (Array.isArray(leavesData)) {
        const myLeaves = leavesData.find(
          (r) =>
            String(r["HR ID"]).trim() ===
            String(profile.hr_id).trim()
        );
        setLeaves(myLeaves || {});
      }
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  /////////////////////////////////////////////
  // FORMAT
  /////////////////////////////////////////////
  const formatTime = (val) => {
    if (!val) return "-";

    const str = String(val);
    if (str.includes("Date")) return "-";

    return str;
  };

  const formatPercent = (val) => {
    if (!val) return "-";

    let num = parseFloat(val);
    if (isNaN(num)) return "-";

    if (num <= 1) num *= 100;

    return num.toFixed(2) + "%";
  };

  /////////////////////////////////////////////
  // FILTER
  /////////////////////////////////////////////
  const filteredData = useMemo(() => {
  let result = [...data];

  // 🔍 Search
  if (search) {
    result = result.filter(
      (r) =>
        r.Name?.toLowerCase().includes(search.toLowerCase()) ||
        String(r["HR ID"]).includes(search)
    );
  }

  // 📅 Date
  if (selectedDate) {
    result = result.filter((r) => r.Date === selectedDate);
  }

  // ⏰ Shift
  if (selectedShift) {
    result = result.filter((r) => r.Shift === selectedShift);
  }

  // 📝 Notes
  if (selectedNote) {
    result = result.filter((r) =>
      (r.Notes || "").toLowerCase().includes(selectedNote.toLowerCase())
    );
  }

  return result;
}, [data, search, selectedDate, selectedShift, selectedNote]);

  /////////////////////////////////////////////
  // SORT
  /////////////////////////////////////////////
  const sortedData = useMemo(() => {
    const parseDate = (d) => new Date(d);

    return [...filteredData].sort((a, b) =>
      sortAsc
        ? parseDate(a.Date) - parseDate(b.Date)
        : parseDate(b.Date) - parseDate(a.Date)
    );
  }, [filteredData, sortAsc]);

  /////////////////////////////////////////////
  // KPIs
  /////////////////////////////////////////////
  const cleanPercent = (val) =>
    parseFloat(String(val || "").replace("%", "")) || 0;

  const avgConf =
    sortedData.reduce((a, r) => a + cleanPercent(r.Conformance), 0) /
    (sortedData.length || 1);

  const avgAdh =
    sortedData.reduce((a, r) => a + cleanPercent(r.Adherence), 0) /
    (sortedData.length || 1);

  const totalTardy = sortedData.reduce(
    (sum, r) => sum + (+r["Tardy Minutes"] || 0),
    0
  );

  const loginDays = sortedData.length;

  /////////////////////////////////////////////
  // EXPORT
  /////////////////////////////////////////////
  const exportToExcel = () => {
    if (!sortedData.length) return;

    const worksheet = XLSX.utils.json_to_sheet(sortedData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, "My_Attendance.xlsx");
  };

  /////////////////////////////////////////////
  if (loading) return <h2 style={styles.loading}>Loading...</h2>;

  /////////////////////////////////////////////
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
            placeholder="Search by Name / ID"
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

      <h2 style={styles.title}>My Attendance 📊</h2>

      <div style={styles.layout}>
        {/* LEFT */}
        <div style={styles.panel}>
          <KPI title="Login Days" value={loginDays} />
          <KPI title="Total Tardy Minutes" value={totalTardy} />
          <KPI title="Avg. Conformance" value={avgConf.toFixed(2)} />
          <KPI title="Avg. Adherence" value={avgAdh.toFixed(2)} />
        </div>

        {/* TABLE */}
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>HR ID</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Month</th>
                <th style={styles.th}>Day</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Shift</th>
                <th style={styles.th}>First Login</th>
                <th style={styles.th}>Last Logout</th>
                <th style={styles.th}>Total Login</th>
                <th style={styles.th}>Tardy Minutes</th>
                <th style={styles.th}>Conformance</th>
                <th style={styles.th}>Adherence</th>
                <th style={styles.th}>Notes</th>
              </tr>
            </thead>

            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan="13" style={styles.noData}>
                    No Data Available
                  </td>
                </tr>
              ) : (
                sortedData.map((r, i) => (
                  <tr key={i} style={styles.row}>
                    <td style={styles.center}>{r["HR ID"]}</td>
                    <td style={styles.center}>{r.Name}</td>
                    <td style={styles.center}>{r.Month}</td>
                    <td style={styles.center}>{r.Day}</td>
                    <td style={styles.center}>{r.Date}</td>
                    <td style={styles.center}>{r.Shift}</td>
                    <td style={styles.center}>{formatTime(r["First Login"])}</td>
                    <td style={styles.center}>{formatTime(r["Last Logout"])}</td>
                    <td style={styles.center}>{formatTime(r["Total Login"])}</td>
                    <td style={styles.center}>{r["Tardy Minutes"]}</td>
                    <td style={styles.percent}>
                      {formatPercent(r.Conformance)}
                    </td>
                    <td style={styles.percent}>
                      {formatPercent(r.Adherence)}
                    </td>
                    <td style={styles.center}>{r.Notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* RIGHT */}
        <div style={styles.panel}>
          <KPI title="Total Annuals" value={leaves?.Annual || 0} />
          <KPI title="Total Casuals" value={leaves?.Casual || 0} />
          <KPI title="Total No Show" value={leaves?.["No Show"] || 0} />
          <KPI title="Total UPL" value={leaves?.UPL || 0} />
          <KPI title="Total Sick" value={leaves?.Sick || 0} />
        </div>
      </div>
    </div>
  );
}

/////////////////////////////////////////////
// KPI
/////////////////////////////////////////////
const KPI = ({ title, value }) => (
  <div style={styles.kpiBox}>
    <div>{title}</div>
    <div style={styles.kpiValue}>{value}</div>
  </div>
);

/////////////////////////////////////////////
// STYLES
/////////////////////////////////////////////
const styles = {
  container: {
    minHeight: "100vh",
    background: "#020617",
    color: "#fff",
    padding: "20px",
    fontFamily: "Calibri",
  },

  title: {
    textAlign: "center",
    color: "#00f0ff",
    marginBottom: "20px",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    borderRadius: "10px",
  },

  backBtn: {
    border: "1px solid cyan",
    color: "cyan",
    padding: "10px",
    background: "transparent",
    borderRadius: "10px",
    cursor: "pointer",
  },

  tools: {
    display: "flex",
    gap: "10px",
    borderRadius: "10px",
  },

  input: {
    padding: "8px",
    border: "1px solid cyan",
    background: "#020617",
    color: "cyan",
    borderRadius: "10px",
  },

  btn: {
    border: "1px solid #00f0ff",
    padding: "8px",
    background: "transparent",
    color: "#00f0ff",
    cursor: "pointer",
    borderRadius: "10px",
  },

  exportBtn: {
    border: "1px solid #22c55e",
    color: "#22c55e",
    padding: "8px",
    background: "transparent",
    cursor: "pointer",
    borderRadius: "10px",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "200px 1fr 200px",
    gap: "20px",
  },

  panel: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    borderRadius: "10px",
  },

  kpiBox: {
    border: "1px solid cyan",
    padding: "12px",
    textAlign: "center",
    borderRadius: "10px",
  },

  kpiValue: {
    color: "#22c55e",
    marginTop: "10px",
  },

  tableWrapper: {
    border: "1px solid cyan",
    padding: "10px",
    borderRadius: "10px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  headerRow: {
    borderBottom: "2px solid cyan",
  },

  th: {
    padding: "10px",
    color: "#00eaff",
    textAlign: "center",
    fontWeight: "bold",
  },

  row: {
    borderBottom: "1px solid #ffffff10",
  },

  center: {
    textAlign: "center",
  },

  percent: {
    color: "#22c55e",
    textAlign: "center",
  },

  noData: {
    textAlign: "center",
    padding: "20px",
    color: "#888",
  },

  loading: {
    textAlign: "center",
    marginTop: "50px",
  },
};

export default AgentAttendance;