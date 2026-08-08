import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function AllEmployees() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState("all");
  const [loading, setLoading] =
    useState(true);

  //////////////////////////////////////
  // fetch employees
  //////////////////////////////////////
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);

    const { data, error } =
      await supabase
        .from("profiles")
        .select("*")
        .order("hr_id", {
          ascending: true,
        });

    if (!error) {
      setEmployees(data || []);
      setFiltered(data || []);
    }

    setLoading(false);
  };

  //////////////////////////////////////
  // filtering
  //////////////////////////////////////
  useEffect(() => {
    let result = [...employees];

    // search
    if (search) {
      result = result.filter(
        (emp) =>
          emp.full_name
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||
          String(emp.hr_id)
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );
    }

    // role filter
    if (roleFilter !== "all") {
      result = result.filter(
        (emp) =>
          emp.role === roleFilter
      );
    }

    setFiltered(result);
  }, [search, roleFilter, employees]);

  //////////////////////////////////////
  // role colors
  //////////////////////////////////////
  const getRoleColor = (role) => {
    if (role === "admin")
      return "#ef4444";

    if (role === "tl")
      return "#a855f7";

    return "#22c55e";
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading Employees...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      
      {/* top bar */}
      <div style={styles.topBar}>
        <button
          style={styles.backBtn}
          onClick={() =>
            navigate(
              "/admin-dashboard"
            )
          }
        >
          ← Back to Dashboard
        </button>

        <h1 style={styles.title}>
          All Employees 👥
        </h1>
      </div>

      {/* filters */}
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search by name / HR ID..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          style={styles.searchInput}
        />

        <select
          value={roleFilter}
          onChange={(e) =>
            setRoleFilter(
              e.target.value
            )
          }
          style={styles.select}
        >
          <option value="all">
            All Roles
          </option>
          <option value="agent">
            Agents
          </option>
          <option value="tl">
            Team Leaders
          </option>
          <option value="admin">
            Admins
          </option>
        </select>
      </div>

      {/* stats */}
      <div style={styles.stats}>
        Total Employees:{" "}
        {filtered.length}
      </div>

      {/* table */}
      <div style={styles.table}>
        <div style={styles.headerRow}>
          <span>HR ID</span>
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Leader</span>
          <span>Status</span>
        </div>

        {filtered.map((emp) => (
          <div
            key={emp.id}
            style={styles.row}
          >
            <span>
              {emp.hr_id || "-"}
            </span>

            <span>
              {emp.full_name}
            </span>

            <span>
              {emp.email}
            </span>

            <span
              style={{
                color:
                  getRoleColor(
                    emp.role
                  ),
                fontWeight:
                  "bold",
              }}
            >
              {emp.role}
            </span>

            <span>
              {emp.leader_id ||
                "-"}
            </span>

            <span
              style={{
                color:
                  "#22c55e",
              }}
            >
              Active
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AllEmployees;

//////////////////////////////////////////////////
// styles
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

  loading: {
    minHeight: "100vh",
    display: "flex",
    justifyContent:
      "center",
    alignItems: "center",
    color: "#00f0ff",
    fontSize: "25px",
  },

  topBar: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  title: {
    color: "#00f0ff",
  },

  backBtn: {
    border:
      "1px solid #00f0ff",
    background:
      "transparent",
    color: "#00f0ff",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  filters: {
    display: "flex",
    justifyContent:
      "space-between",
    marginBottom: "25px",
    gap: "20px",
  },

  searchInput: {
    flex: 1,
    padding: "12px",
    border:
      "1px solid #00f0ff",
    background:
      "transparent",
    color: "#fff",
    borderRadius: "10px",
    outline: "none",
  },

  select: {
    padding: "12px",
    border:
      "1px solid #00f0ff",
    background:
      "transparent",
    color: "#fff",
    borderRadius: "10px",
    outline: "none",
  },

  stats: {
    color: "#a3e635",
    marginBottom: "20px",
    fontWeight: "bold",
  },

  table: {
    border:
      "1px solid #00f0ff",
    borderRadius: "12px",
    overflow: "hidden",
  },

  headerRow: {
    display: "grid",
    gridTemplateColumns:
      "1fr 2fr 2fr 1fr 2fr 1fr",
    padding: "15px",
    background:
      "#0f172a",
    color: "#00f0ff",
    fontWeight: "bold",
  },

  row: {
    display: "grid",
    gridTemplateColumns:
      "1fr 2fr 2fr 1fr 2fr 1fr",
    padding: "15px",
    borderTop:
      "1px solid #ffffff11",
  },
};