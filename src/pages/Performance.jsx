import { useEffect, useState } from "react";
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

function Performance() {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState("Inbound Calls");
  const [userName, setUserName] = useState("");
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

  // 🔥 تنظيف القيم
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

  // =========================
  const fetchData = async (metric) => {
    setLoading(true);

    try {
      const url = `https://opensheet.elk.sh/${sheetID}/${metric}`;
      const res = await fetch(url);

      if (!res.ok) {
        setData([]);
        setLoading(false);
        return;
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("ERROR:", err);
      setData([]);
    }

    setLoading(false);
  };

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();

    if (!data?.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", data.user.id)
      .single();

    setUserName(profile?.full_name || "User");
  };

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (userName) fetchData(selectedMetric);
  }, [selectedMetric, userName]);

  useEffect(() => {
    const result = data.filter((row) => row.Name === userName);
    setFiltered(result);
  }, [data, userName]);

  const sortedData =
    filtered.length > 0
      ? [...filtered].sort(
          (a, b) => new Date(a.Date) - new Date(b.Date)
        )
      : [];

  const config = metricConfig[selectedMetric];

  const total = sortedData.reduce(
    (sum, row) => sum + getMetricValue(row),
    0
  );

  const result =
    config.calc === "avg"
      ? total / (sortedData.length || 1)
      : total;

  const formatValue = (val) => {
    if (config.type === "percent") {
      return val.toFixed(2) + "%";
    }
    return val.toFixed(2);
  };

  // 📊 Chart Safe
  const chartData = {
    labels: sortedData.map((row) => row.Date),
    datasets: [
      {
        label: selectedMetric,
        data: sortedData.map((row) => getMetricValue(row)),
        borderColor: "#00f0ff",
        backgroundColor: "#00f0ff22",
        tension: 0.3,
        borderWidth: 3,
        pointRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: { color: "#fff" },
      },
    },
    scales: {
      x: { ticks: { color: "#fff" } },
      y: {
        ticks: {
          color: "#fff",
          callback: (val) =>
            config.type === "percent" ? val + "%" : val,
        },
      },
    },
  };

  // =========================

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.topBar}>
        <button
          style={styles.backBtn}
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>

      <h2 style={styles.welcome}>Welcome {userName} 👋</h2>
      <p style={styles.role}>AGENT</p>

      {/* Metrics */}
      <div style={styles.metrics}>
        {Object.keys(metricConfig).map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMetric(m)}
            style={styles.metricBtn}
          >
            {m}
          </button>
        ))}
      </div>

      <p style={styles.records}>
        Records: {sortedData.length}
      </p>

      {/* Table */}
      <div style={styles.table}>
        <div style={styles.headerRow}>
          <span>HR ID</span>
          <span>Name</span>
          <span>Leader</span>
          <span>Month</span>
          <span>Day</span>
          <span>Date</span>
          <span>{selectedMetric}</span>
        </div>

        {sortedData.map((row, i) => (
          <div key={i} style={styles.row}>
            <span>{row["HR ID"]}</span>
            <span>{row.Name}</span>
            <span>{row.Leader}</span>
            <span>{row.Month}</span>
            <span>{row.Day}</span>
            <span>{row.Date}</span>
            <span style={{ color: "#22c55e" }}>
              {formatValue(getMetricValue(row))}
            </span>
          </div>
        ))}
      </div>

      {/* Result */}
      <h3 style={styles.avg}>
        {config.calc === "avg" ? "Average" : "Total"}{" "}
        {selectedMetric}: {formatValue(result)}
      </h3>

      {/* Chart */}
      <div style={styles.chartBox}>
        {sortedData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <p style={{ textAlign: "center" }}>
            No data available
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a)",
    color: "#fff",
    padding: "40px",
    fontFamily: "Comic Sans MS",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#00f0ff",
    fontSize: "22px",
  },

  topBar: { marginBottom: "20px" },

  backBtn: {
    border: "1px solid #00f0ff",
    padding: "10px",
    background: "transparent",
    color: "#00f0ff",
    cursor: "pointer",
  },

  welcome: { color: "#a3e635" },
  role: { color: "#00f0ff" },

  metrics: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    flexWrap: "wrap",
    margin: "20px 0",
  },

  metricBtn: {
    border: "1px solid #00f0ff",
    background: "transparent",
    color: "#00f0ff",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  records: { textAlign: "center" },

  table: {
    border: "1px solid #00f0ff",
    borderRadius: "10px",
    padding: "20px",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    color: "#00f0ff",
    fontWeight: "bold",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px",
    borderBottom: "1px solid #ffffff22",
  },

  avg: {
    textAlign: "center",
    marginTop: "20px",
    color: "#22c55e",
  },

  chartBox: {
    marginTop: "30px",
    padding: "20px",
    border: "1px solid #00f0ff",
    borderRadius: "10px",
    height: "300px",
  },
};

export default Performance;