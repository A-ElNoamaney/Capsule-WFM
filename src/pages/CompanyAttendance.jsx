import {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

import { useNavigate } from "react-router-dom";

const sheetID =
  "1JcJ4I6suMe5fWatvOhhiYiNvLA3aqsxjAGNzygbvqOY";

const columns = [
  "HR ID",
  "Name",
  "Leader",
  "Month",
  "Day",
  "Date",
  "Shift",
  "First Login",
  "Last Logout",
  "Total Login",
  "Tardy Minutes",
  "Conformance",
  "Adherence",
  "Notes",
];

function CompanyAttendance() {
  const navigate = useNavigate();

  const [data, setData] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState("");

  const [selectedLeader, setSelectedLeader] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  //////////////////////////////////////
  // Fetch Attendance
  //////////////////////////////////////
  const fetchAttendance =
    useCallback(async () => {
      setLoading(true);

      try {
        const res =
          await fetch(
            `https://opensheet.elk.sh/${sheetID}/Attendance`
          );

        const json =
          await res.json();

        // حماية لو API رجعت object/error
        if (Array.isArray(json)) {
          setData(json);
        } else {
          console.log(
            "Invalid attendance response:",
            json
          );
          setData([]);
        }
      } catch (err) {
        console.log(err);
        setData([]);
      }

      setLoading(false);
    }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  //////////////////////////////////////
  // Filtered Data
  //////////////////////////////////////
  const filteredData =
    useMemo(() => {
      if (!Array.isArray(data))
        return [];

      let result = [...data];

      if (search) {
        result =
          result.filter(
            (row) =>
              row.Name?.toLowerCase().includes(
                search.toLowerCase()
              ) ||
              String(
                row["HR ID"] || ""
              ).includes(search)
          );
      }

      if (selectedDate) {
        result =
          result.filter(
            (row) =>
              row.Date ===
              selectedDate
          );
      }

      if (selectedLeader) {
        result =
          result.filter(
            (row) =>
              row.Leader ===
              selectedLeader
          );
      }

      return result;
    }, [
      data,
      search,
      selectedDate,
      selectedLeader,
    ]);

  //////////////////////////////////////
  // Helpers
  //////////////////////////////////////
  const cleanPercent = (
    value
  ) => {
    return (
      parseFloat(
        String(value || "")
          .replace("%", "")
          .trim()
      ) || 0
    );
  };

  const cleanNumber = (
    value
  ) => {
    return (
      parseFloat(value) || 0
    );
  };

  //////////////////////////////////////
  // KPI Calculations
  //////////////////////////////////////
  const totalTardy =
    filteredData.reduce(
      (sum, row) =>
        sum +
        cleanNumber(
          row[
            "Tardy Minutes"
          ]
        ),
      0
    );

  const avgConformance =
    filteredData.length > 0
      ? filteredData.reduce(
          (sum, row) =>
            sum +
            cleanPercent(
              row.Conformance
            ),
          0
        ) /
        filteredData.length
      : 0;

  const avgAdherence =
    filteredData.length > 0
      ? filteredData.reduce(
          (sum, row) =>
            sum +
            cleanPercent(
              row.Adherence
            ),
          0
        ) /
        filteredData.length
      : 0;

  const employeesLogged =
    new Set(
      filteredData.map(
        (row) =>
          row["HR ID"]
      )
    ).size;

  //////////////////////////////////////
  if (loading) {
    return (
      <div style={styles.loading}>
        Loading Attendance...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Top */}
      <div style={styles.topBar}>
        <button
          style={styles.btn}
          onClick={() =>
            navigate(
              "/admin-dashboard"
            )
          }
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiBox}>
          Avg Conformance
          <div style={styles.kpiValue}>
            {avgConformance.toFixed(
              2
            )}
            %
          </div>
        </div>

        <div style={styles.kpiBox}>
          Avg Adherence
          <div style={styles.kpiValue}>
            {avgAdherence.toFixed(
              2
            )}
            %
          </div>
        </div>

        <div style={styles.kpiBox}>
          Total Tardy
          <div style={styles.kpiValue}>
            {totalTardy}
          </div>
        </div>

        <div style={styles.kpiBox}>
          Employees Logged
          <div style={styles.kpiValue}>
            {employeesLogged}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <input
          style={styles.input}
          placeholder="Search Name / HR ID"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        <select
          style={styles.input}
          value={selectedDate}
          onChange={(e) =>
            setSelectedDate(
              e.target.value
            )
          }
        >
          <option value="">
            All Dates
          </option>

          {[...new Set(
            data.map(
              (row) =>
                row.Date
            )
          )].map(
            (date) => (
              <option
                key={date}
                value={date}
              >
                {date}
              </option>
            )
          )}
        </select>

        <select
          style={styles.input}
          value={
            selectedLeader
          }
          onChange={(e) =>
            setSelectedLeader(
              e.target.value
            )
          }
        >
          <option value="">
            All Leaders
          </option>

          {[...new Set(
            data.map(
              (row) =>
                row.Leader
            )
          )].map(
            (leader) => (
              <option
                key={
                  leader
                }
                value={
                  leader
                }
              >
                {leader}
              </option>
            )
          )}
        </select>
      </div>

      {/* Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map(
                (col) => (
                  <th
                    key={col}
                    style={
                      styles.th
                    }
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {filteredData.length >
            0 ? (
              filteredData.map(
                (
                  row,
                  index
                ) => (
                  <tr
                    key={
                      index
                    }
                  >
                    {columns.map(
                      (
                        col
                      ) => (
                        <td
                          key={
                            col
                          }
                          style={
                            styles.td
                          }
                        >
                          {row[
                            col
                          ] ||
                            "-"}
                        </td>
                      )
                    )}
                  </tr>
                )
              )
            ) : (
              <tr>
                <td
                  colSpan={
                    columns.length
                  }
                  style={
                    styles.emptyState
                  }
                >
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CompanyAttendance;

////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#020617,#0f172a)",
    color: "#fff",
    padding: "30px",
    fontFamily:
      "Calibri",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    justifyContent:
      "center",
    alignItems:
      "center",
    color: "#00f0ff",
    fontSize: "24px",
  },

  topBar: {
    marginBottom: "25px",
  },

  btn: {
    border:
      "1px solid #00f0ff",
    background:
      "transparent",
    color: "#00f0ff",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4,1fr)",
    gap: "15px",
    marginBottom: "25px",
  },

  kpiBox: {
    border:
      "1px solid #00f0ff",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    boxShadow:
      "0 0 15px #00f0ff22",
  },

  kpiValue: {
    color: "#22c55e",
    fontSize: "28px",
    marginTop: "10px",
    fontWeight: "bold",
  },

  filters: {
    display: "flex",
    gap: "15px",
    marginBottom: "25px",
    flexWrap: "wrap",
  },

  input: {
    padding: "12px",
    minWidth: "220px",
    border:
      "1px solid #00f0ff",
    background:
      "transparent",
    color: "#6ab1f3",
    borderRadius: "10px",
    fontWeight: "bold",
  },

  tableWrapper: {
    overflowX: "auto",
    border:
      "1px solid #00f0ff",
    borderRadius: "12px",
  },

  table: {
    width: "100%",
    minWidth: "1800px",
    borderCollapse:
      "collapse",
  },

  th: {
    padding: "14px",
    color: "#00f0ff",
    borderBottom:
      "1px solid #00f0ff",
  },

  td: {
    padding: "12px",
    textAlign: "center",
    borderBottom:
      "1px solid #ffffff11",
  },

  emptyState: {
    textAlign: "center",
    padding: "30px",
    color: "#ccc",
  },
};