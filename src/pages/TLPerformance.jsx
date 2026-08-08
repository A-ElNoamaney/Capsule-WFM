import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

function TLPerformance() {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState("Inbound Calls");
  const [teamNames, setTeamNames] = useState([]);
  const [leaderName, setLeaderName] = useState("");
  const [loading, setLoading] = useState(true);

  const sheetID = "1WqWV9_Sy5UHxcVA4uqUo_HKmPeBuqA-uvkItgPQk2Io";

  const metricConfig = {
    "Inbound Calls": { type: "number", calc: "sum" },
    "Complaints Count": { type: "number", calc: "sum" },
    AHT: { type: "number", calc: "avg" },
    ACW: { type: "number", calc: "avg" },
    "Answer Rate": { type: "percent", calc: "avg" },
    Occupancy: { type: "percent", calc: "avg" },
    "Quality Score": { type: "percent", calc: "avg" },
  };

  //////////////////////////////////////
  // clean metric values
  //////////////////////////////////////
  const getMetricValue = (row) => {
    const key = Object.keys(row).find(
      (k) => k.trim() === selectedMetric.trim()
    );

    if (!key) return 0;

    const raw = row[key];

    const cleaned = String(raw)
      .replace("%", "")
      .replace(/[^\d.]/g, "")
      .trim();

    return parseFloat(cleaned) || 0;
  };

  //////////////////////////////////////
  // Get TL Team
  //////////////////////////////////////
  const getTeamMembers = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: leaderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    setLeaderName(
      leaderProfile?.full_name || "Leader"
    );

    const { data: teamMembers } = await supabase
      .from("profiles")
      .select("full_name")
      .ilike(
        "leader_id",
        leaderProfile.full_name
      )
      .eq("role", "agent");

    const names =
      teamMembers?.map(
        (m) => m.full_name
      ) || [];

    setTeamNames(names);
  };

  //////////////////////////////////////
  // Fetch metric sheet
  //////////////////////////////////////
  const fetchData = useCallback(async () => {
  setLoading(true);

  try {
    const url = `https://opensheet.elk.sh/${sheetID}/${selectedMetric}`;
    const res = await fetch(url);

    if (!res.ok) {
      setData([]);
      setLoading(false);
      return;
    }

    const json = await res.json();

    const teamFiltered = json.filter((row) =>
      teamNames.includes(row.Name)
    );

    setData(teamFiltered);

  } catch (err) {
    console.error(err);
    setData([]);
  }

  setLoading(false);

}, [selectedMetric, teamNames]);

  const [searchName, setSearchName] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  
  useEffect(() => {
    getTeamMembers();
  }, []);

  useEffect(() => {
  if (teamNames.length > 0) {
    fetchData();
  }
}, [fetchData, teamNames]);

  //////////////////////////////////////
  // Filter Team Data
  //////////////////////////////////////
 useEffect(() => {
  const result = data.filter((row) =>
    teamNames.includes(row.Name)
  );

  console.log(
    "Sample Dates:",
    result.slice(0, 10).map((r) => r.Date)
  );

  setFiltered(result);
}, [data, teamNames]);
  

  //////////////////////////////////////
  // sorting
  //////////////////////////////////////
  let finalData = [...filtered];

// filter by name
if (searchName) {
  finalData = finalData.filter((row) =>
    row.Name.toLowerCase().includes(
      searchName.toLowerCase()
    )
  );
}

// filter by date
if (selectedDate) {
  finalData = finalData.filter(
    (row) => row.Date === selectedDate
  );
}

// sort by date
const sortedData = finalData.sort(
  (a, b) =>
    new Date(a.Date) -
    new Date(b.Date)
);

  //////////////////////////////////////
  // total/avg
  //////////////////////////////////////
  const config =
    metricConfig[selectedMetric];

  const total = sortedData.reduce(
    (sum, row) =>
      sum + getMetricValue(row),
    0
  );

  const result =
    config.calc === "avg"
      ? total /
        (sortedData.length || 1)
      : total;

  const formatValue = (val) => {
    if (config.type === "percent") {
      return val.toFixed(2) + "%";
    }

    return val.toFixed(2);
  };

  //////////////////////////////////////
  // chart
  //////////////////////////////////////
  const chartData = {
    labels: sortedData.map(
      (row) => row.Date
    ),
    datasets: [
      {
        label: selectedMetric,
        data: sortedData.map((row) =>
          getMetricValue(row)
        ),
        borderColor: "#00f0ff",
        backgroundColor:
          "#00f0ff22",
        tension: 0.3,
        borderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#fff",
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#fff",
        },
      },
      y: {
        ticks: {
          color: "#fff",
        },
      },
    },
  };

  //////////////////////////////////////
  if (loading) {
    return (
      <div style={styles.loading}>
        Loading...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Back */}
      <button
        style={styles.backBtn}
        onClick={() =>
          navigate("/dashboard")
        }
      >
        ← Back to Dashboard
      </button>

      <h2 style={styles.title}>
        My Team Performance 📈
      </h2>

      <p style={styles.subTitle}>
        Leader: {leaderName}
      </p>

      {/* metrics */}
      <div style={styles.metrics}>
        {Object.keys(metricConfig).map(
          (metric) => (
            <button
              key={metric}
              style={styles.metricBtn}
              onClick={() =>
                setSelectedMetric(
                  metric
                )
              }
            >
              {metric}
            </button>
          )
        )}
      </div>
      {/* Search + Date Filter */}
<div style={styles.filterBar}>
  <input
    type="text"
    placeholder="🔍 Search agent name..."
    value={searchName}
    onChange={(e) =>
      setSearchName(e.target.value)
    }
    style={styles.searchInput}
  />

  <select
  value={selectedDate}
  onChange={(e) =>
    setSelectedDate(e.target.value)
  }
  style={styles.dateInput}
>
  <option value="">
    All Dates
  </option>

  {[...new Set(filtered.map((r) => r.Date))].map(
    (date, index) => (
      <option
        key={index}
        value={date}
      >
        {date}
      </option>
    )
  )}
</select>
</div>

      <p style={styles.records}>
        Team Records: {sortedData.length}
      </p>

      {/* table */}
      <div style={styles.table}>
        <div style={styles.headerRow}>
          <span>HR ID</span>
          <span>Name</span>
          <span>Leader</span>
          <span>Date</span>
          <span>
            {selectedMetric}
          </span>
        </div>

        {sortedData.map(
          (row, index) => (
            <div
              key={index}
              style={styles.row}
            >
              <span>
                {row["HR ID"]}
              </span>

              <span>
                {row.Name}
              </span>

              <span>
                {row.Leader}
              </span>

              <span>
                {row.Date}
              </span>

              <span
                style={{
                  color:
                    "#22c55e",
                }}
              >
                {formatValue(
                  getMetricValue(
                    row
                  )
                )}
              </span>
            </div>
          )
        )}
      </div>

      {/* result */}
      <h3 style={styles.avg}>
        {config.calc === "avg"
          ? "Team Average"
          : "Team Total"}{" "}
        {selectedMetric}:{" "}
        {formatValue(result)}
      </h3>

      {/* chart */}
      <div style={styles.chartBox}>
        {sortedData.length >
        0 ? (
          <Line
            data={chartData}
            options={options}
          />
        ) : (
          <p
            style={{
              textAlign:
                "center",
            }}
          >
            No Team Data
          </p>
        )}
      </div>
    </div>
  );
}

export default TLPerformance;

//////////////////////////////////////////////////
// styles
//////////////////////////////////////////////////

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#020617,#0f172a)",
    color: "#fff",
    padding: "40px",
    fontFamily:
      "Comic Sans MS",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#00f0ff",
    fontSize: "24px",
  },

  title: {
    textAlign: "center",
    color: "#00f0ff",
  },

  subTitle: {
    textAlign: "center",
    color: "#a3e635",
    marginBottom: "20px",
  },

  backBtn: {
    border:
      "1px solid #00f0ff",
    background:
      "transparent",
    color: "#00f0ff",
    padding: "10px 15px",
    cursor: "pointer",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  metrics: {
    display: "flex",
    justifyContent:
      "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },

  metricBtn: {
    border:
      "1px solid #00f0ff",
    background:
      "transparent",
    color: "#00f0ff",
    padding: "10px",
    cursor: "pointer",
    borderRadius: "10px",
  },

  records: {
    textAlign: "center",
    marginBottom: "20px",
  },

  table: {
    border:
      "1px solid #00f0ff",
    padding: "20px",
    borderRadius: "10px",
  },

  headerRow: {
    display: "grid",
    gridTemplateColumns:
      "repeat(5,1fr)",
    color: "#00f0ff",
    fontWeight: "bold",
    marginBottom: "15px",
  },

  row: {
    display: "grid",
    gridTemplateColumns:
      "repeat(5,1fr)",
    padding: "10px 0",
    borderBottom:
      "1px solid #ffffff22",
  },

  avg: {
    textAlign: "center",
    marginTop: "25px",
    color: "#22c55e",
  },

  chartBox: {
    marginTop: "30px",
    height: "350px",
    border:
      "1px solid #00f0ff",
    borderRadius: "10px",
    padding: "20px",
  },

  filterBar: {
  display: "flex",
  justifyContent: "center",
  gap: "15px",
  marginBottom: "25px",
  flexWrap: "wrap",
},

searchInput: {
  padding: "12px",
  width: "250px",
  border: "1px solid #00f0ff",
  background: "transparent",
  color: "#39e0c4",
  borderRadius: "10px",
  outline: "none",
  fontFamily: "Comic Sans MS",
},

dateInput: {
  padding: "12px",
  border: "1px solid #00f0ff",
  background: "transparent",
  color: "#1c8db9",
  borderRadius: "10px",
  outline: "none",
  fontFamily: "Comic Sans MS",
},
};