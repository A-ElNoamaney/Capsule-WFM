import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const metrics = [
    "Inbound Calls",
    "AHT",
    "ACW",
    "Answer Rate",
    "Occupancy",
    "Quality Score",
    "Complaints Count",
  ];

function CompanyPerformance() {
  const navigate = useNavigate();

  const sheetID =
    "1WqWV9_Sy5UHxcVA4uqUo_HKmPeBuqA-uvkItgPQk2Io";


  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] =
    useState([]);
  const [search, setSearch] =
    useState("");
  const [selectedDate, setSelectedDate] =
    useState("");
  const [loading, setLoading] =
    useState(true);

  ////////////////////////////////////////////
  // Clean numbers
  ////////////////////////////////////////////
  const cleanValue = (val) => {
    if (!val) return 0;

    return (
      parseFloat(
        String(val)
          .replace("%", "")
          .replace(/[^\d.]/g, "")
      ) || 0
    );
  };

  ////////////////////////////////////////////
  // Fetch all sheets
  ////////////////////////////////////////////
  const fetchAllPerformance = useCallback(async () => {
  setLoading(true);

  try {
    let mergedData = {};

    for (const metric of metrics) {
      const res = await fetch(
        `https://opensheet.elk.sh/${sheetID}/${metric}`
      );

      const rows = await res.json();

      rows.forEach((row) => {
        const uniqueKey = `${row["HR ID"]}_${row.Date}`;

        if (!mergedData[uniqueKey]) {
          mergedData[uniqueKey] = {
            "HR ID": row["HR ID"],
            Name: row.Name,
            Leader: row.Leader,
            Date: row.Date,
          };
        }

        mergedData[uniqueKey][metric] = row[metric];
      });
    }

    const finalData = Object.values(mergedData);

    setTableData(finalData);
    setFilteredData(finalData);

  } catch (err) {
    console.log(err);
  }

  setLoading(false);
}, []);

  useEffect(() => {
  fetchAllPerformance();
}, [fetchAllPerformance]);

  ////////////////////////////////////////////
  // Filters
  ////////////////////////////////////////////
  useEffect(() => {
    let result = [
      ...tableData,
    ];

    if (search) {
      result =
        result.filter(
          (row) =>
            row.Name
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            String(
              row[
                "HR ID"
              ]
            ).includes(
              search
            )
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

    setFilteredData(
      result
    );
  }, [
    search,
    selectedDate,
    tableData,
  ]);

  ////////////////////////////////////////////
  // KPI totals
  ////////////////////////////////////////////
  const getMetricResult = (
    metric
  ) => {
    const values =
      filteredData.map(
        (row) =>
          cleanValue(
            row[
              metric
            ]
          )
      );

    if (
      metric ===
        "Inbound Calls" ||
      metric ===
        "Complaints Count"
    ) {
      return values.reduce(
        (
          a,
          b
        ) => a + b,
        0
      );
    }

    const avg =
      values.reduce(
        (
          a,
          b
        ) => a + b,
        0
      ) /
      (values.length ||
        1);

    if (
      metric ===
        "Answer Rate" ||
      metric ===
        "Occupancy" ||
      metric ===
        "Quality Score"
    ) {
      return (
        avg.toFixed(
          2
        ) + "%"
      );
    }

    return avg.toFixed(
      2
    );
  };

  ////////////////////////////////////////////
  if (loading) {
    return (
      <div style={styles.loading}>
        Loading...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div style={styles.topBar}>
  <button
    style={styles.btn}
    onClick={() => navigate("/admin-dashboard")}
  >
    ← Back to Dashboard
  </button>
</div>
      </div>

      {/* KPI Boxes */}
      <div
        style={
          styles.metricsContainer
        }
      >
        {metrics.map(
          (
            metric
          ) => (
            <div
              key={
                metric
              }
              style={
                styles.metricBox
              }
            >
              <div>
                {
                  metric
                }
              </div>

              <div
                style={
                  styles.metricValue
                }
              >
                {getMetricResult(
                  metric
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search Name / HR ID"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          style={styles.input}
        />

        <select
          value={
            selectedDate
          }
          onChange={(e) =>
            setSelectedDate(
              e.target.value
            )
          }
          style={styles.input}
        >
          <option value="">
            All Dates
          </option>

          {[
            ...new Set(
              tableData.map(
                (
                  row
                ) =>
                  row.Date
              )
            ),
          ].map(
            (
              date
            ) => (
              <option
                key={
                  date
                }
                value={
                  date
                }
              >
                {date}
              </option>
            )
          )}
        </select>
      </div>

      {/* Table */}
      <div
        style={
          styles.tableWrapper
        }
      >
        <table
          style={
            styles.table
          }
        >
          <thead>
            <tr>
              <th style={styles.th}>
                HR ID
              </th>
              <th style={styles.th}>
                Name
              </th>
              <th style={styles.th}>
                Leader
              </th>
              <th style={styles.th}>
                Date
              </th>
              <th style={styles.th}>
                Inbound Calls
              </th>
              <th style={styles.th}>
                AHT
              </th>
              <th style={styles.th}>
                ACW
              </th>
              <th style={styles.th}>
                Answer Rate
              </th>
              <th style={styles.th}>
                Occupancy
              </th>
              <th style={styles.th}>
                Quality Score
              </th>
              <th style={styles.th}>
                Complaints
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map(
              (
                row,
                index
              ) => (
                <tr
                  key={
                    index
                  }
                >
                  <td style={styles.td}>
                    {
                      row[
                        "HR ID"
                      ]
                    }
                  </td>

                  <td style={styles.td}>
                    {
                      row.Name
                    }
                  </td>

                  <td style={styles.td}>
                    {
                      row.Leader
                    }
                  </td>

                  <td style={styles.td}>
                    {
                      row.Date
                    }
                  </td>

                  {metrics.map(
                    (
                      metric
                    ) => (
                      <td
                        key={
                          metric
                        }
                        style={
                          styles.td
                        }
                      >
                        {row[
                          metric
                        ] ||
                          "-"}
                      </td>
                    )
                  )}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CompanyPerformance;

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
    fontFamily: "Franklin Gothic",
    fontWeight: "bold",
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
    display: "flex",
    justifyContent:
      "space-between",
    marginBottom:
      "30px",
  },

  btn: {
    border:
      "1px solid #00f0ff",
    background:
      "transparent",
    color: "#00f0ff",
    padding:
      "12px 18px",
    borderRadius:
      "10px",
    cursor: "pointer",
    boxShadow:
      "0 0 10px #00f0ff55",
  },

  metricsContainer: {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "12px",
  marginBottom: "20px",
  },

  metricBox: {
  border: "1px solid #00f0ff",
  padding: "8px",
  borderRadius: "10px",
  textAlign: "center",
  background: "#020617",
  boxShadow: "0 0 8px #00f0ff22",
  minHeight: "50px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
},

  metricValue: {
  marginTop: "6px",
  color: "#22c55e",
  fontSize: "20px",
  fontWeight: "bold",
},

  filters: {
    display: "flex",
    gap: "15px",
    marginBottom:
      "25px",
  },

  input: {
    padding:
      "12px",
    width: "220px",
    border:
      "1px solid #00f0ff",
    borderRadius:
      "10px",
    background:
      "transparent",
    color: "#245c9c",
    outline:
      "none",
  },

  tableWrapper: {
    border:
      "1px solid #00f0ff",
    borderRadius:
      "12px",
    overflowX:
      "auto",
  },

  table: {
    width: "100%",
    borderCollapse:
      "collapse",
    minWidth:
      "1400px",
  },

  th: {
    padding:
      "15px",
    color:
      "#00f0ff",
    borderBottom:
      "1px solid #00f0ff",
    textAlign:
      "center",
  },

  td: {
    padding:
      "14px",
    textAlign:
      "center",
    borderBottom:
      "1px solid #ffffff11",
  },
};