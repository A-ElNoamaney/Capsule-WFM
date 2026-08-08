import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function TLSchedule() {
  const navigate = useNavigate();

  const [teamSchedules, setTeamSchedules] = useState([]);
  const [teamBreaks, setTeamBreaks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamSchedule();
  }, []);

  ////////////////////////////////////////////////
  // Dynamic Schedule Columns
  ////////////////////////////////////////////////
  const scheduleColumns =
    teamSchedules.length > 0
      ? Object.keys(teamSchedules[0]).filter(
          (key) =>
            key !== "HR ID" &&
            key !== "Name" &&
            key !== "Leader" &&
            key !== "agentName" &&
            key !== "hr_id"
        )
      : [];

  ////////////////////////////////////////////////
  // Fetch Team Schedule + Breaks
  ////////////////////////////////////////////////
  const fetchTeamSchedule = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: leaderProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      ////////////////////////////////////////////////
      // Team Members
      ////////////////////////////////////////////////
      const { data: teamMembers } = await supabase
        .from("profiles")
        .select("id, full_name, hr_id")
        .eq("leader_id", leaderProfile.full_name)
        .eq("role", "agent");

      if (!teamMembers?.length) {
        setLoading(false);
        return;
      }

      ////////////////////////////////////////////////
      // Schedule Sheet
      ////////////////////////////////////////////////
      const scheduleRes = await fetch(
        "https://opensheet.elk.sh/1NdHIirHap0hRk1qcbKzEnCsLMxNVfUmW73YG9xoiacM/Sheet1"
      );

      const scheduleRows =
        await scheduleRes.json();

      const filteredSchedules = teamMembers
        .map((member) => {
          const scheduleRow =
            scheduleRows.find(
              (row) =>
                String(
                  row["HR ID"]
                ).trim() ===
                String(
                  member.hr_id
                ).trim()
            );

          if (scheduleRow) {
            return {
              ...scheduleRow,
              agentName:
                member.full_name,
              hr_id:
                member.hr_id,
            };
          }

          return null;
        })
        .filter(Boolean);

      ////////////////////////////////////////////////
      // Breaks Sheet
      ////////////////////////////////////////////////
      const breakRes = await fetch(
        "https://opensheet.elk.sh/1NdHIirHap0hRk1qcbKzEnCsLMxNVfUmW73YG9xoiacM/Breaks"
      );

      const breakRows =
        await breakRes.json();

      const filteredBreaks = teamMembers
        .map((member) => {
          const breakRow =
            breakRows.find(
              (row) =>
                String(
                  row["HR ID"]
                ).trim() ===
                String(
                  member.hr_id
                ).trim()
            );

          if (breakRow) {
            return {
              ...breakRow,
              agentName:
                member.full_name,
            };
          }

          return null;
        })
        .filter(Boolean);

      setTeamSchedules(
        filteredSchedules
      );
      setTeamBreaks(filteredBreaks);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  ////////////////////////////////////////////////
  // Export Excel
  ////////////////////////////////////////////////
  const exportToExcel = () => {
    if (!teamSchedules.length) return;

    const exportData =
      teamSchedules.map(
        (agent) => {
          const row = {
            Name:
              agent.agentName,
            "HR ID":
              agent.hr_id,
          };

          scheduleColumns.forEach(
            (col) => {
              row[col] =
                agent[col];
            }
          );

          return row;
        }
      );

    const ws =
      XLSX.utils.json_to_sheet(
        exportData
      );

    const wb =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Team Schedule"
    );

    const buffer =
      XLSX.write(wb, {
        bookType: "xlsx",
        type: "array",
      });

    const file = new Blob(
      [buffer],
      {
        type: "application/octet-stream",
      }
    );

    saveAs(
      file,
      "Team_Schedule.xlsx"
    );
  };

  if (loading) {
    return (
      <h2 style={styles.loading}>
        Loading...
      </h2>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        My Team Schedule 📅
      </h2>

      {/* Top Bar */}
      <div style={styles.topBar}>
        <button
          style={styles.backBtn}
          onClick={() =>
            navigate(
              "/dashboard"
            )
          }
        >
          ← Back to Dashboard
        </button>

        <button
          style={styles.exportBtn}
          onClick={
            exportToExcel
          }
        >
          Export Team Schedule 📥
        </button>
      </div>

      {/* Schedule Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th
                style={
                  styles.headerCell
                }
              >
                Agent
              </th>

              {scheduleColumns.map(
                (day) => (
                  <th
                    key={day}
                    style={
                      styles.headerCell
                    }
                  >
                    {day}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {teamSchedules.map(
              (
                agent,
                index
              ) => (
                <tr key={index}>
                  <td
                    style={
                      styles.cell
                    }
                  >
                    {
                      agent.agentName
                    }
                  </td>

                  {scheduleColumns.map(
                    (
                      day
                    ) => (
                      <td
                        key={
                          day
                        }
                        style={
                          styles.cell
                        }
                      >
                        {agent[
                          day
                        ] ||
                          "OFF"}
                      </td>
                    )
                  )}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Breaks Table */}
      <div style={styles.breakBox}>
        <h3 style={styles.breakTitle}>
          Team Breaks ☕
        </h3>

        <table style={styles.table}>
          <thead>
            <tr>
              <th
                style={
                  styles.headerCell
                }
              >
                Agent
              </th>

              <th
                style={
                  styles.headerCell
                }
              >
                Break 1
              </th>

              <th
                style={
                  styles.headerCell
                }
              >
                Break 2
              </th>

              <th
                style={
                  styles.headerCell
                }
              >
                Break 3
              </th>
            </tr>
          </thead>

          <tbody>
            {teamBreaks.map(
              (
                agent,
                index
              ) => (
                <tr key={index}>
                  <td
                    style={
                      styles.cell
                    }
                  >
                    {
                      agent.agentName
                    }
                  </td>

                  <td
                    style={
                      styles.cell
                    }
                  >
                    {agent[
                      "Break 1 (15 Min)"
                    ] ||
                      "-"}
                  </td>

                  <td
                    style={
                      styles.cell
                    }
                  >
                    {agent[
                      "Break 2 (30 Min)"
                    ] ||
                      "-"}
                  </td>

                  <td
                    style={
                      styles.cell
                    }
                  >
                    {agent[
                      "Break 3 (15 Min)"
                    ] ||
                      "-"}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TLSchedule;

//////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////

const styles = {
  container: {
    minHeight: "100vh",
    background: "#020617",
    color: "#fff",
    padding: "40px",
    fontFamily:
      "Comic Sans MS",
  },

  title: {
    textAlign: "center",
    marginBottom: "25px",
    color: "#00f0ff",
    fontSize: "40px",
    fontFamily:
      "Papyrus",
  },

  loading: {
    textAlign: "center",
    marginTop: "100px",
    color: "#00f0ff",
  },

  topBar: {
    display: "flex",
    justifyContent:
      "space-between",
    marginBottom: "20px",
  },

  backBtn: {
    border:
      "1px solid #00f0ff",
    padding: "12px 18px",
    background:
      "transparent",
    color: "#00f0ff",
    cursor: "pointer",
    borderRadius: "10px",
  },

  exportBtn: {
    border:
      "1px solid #00f0ff",
    padding: "12px 18px",
    background:
      "transparent",
    color: "#00f0ff",
    cursor: "pointer",
    borderRadius: "10px",
  },

  tableWrapper: {
    border:
      "2px solid #00f0ff",
    boxShadow:
      "0 0 20px rgba(0,240,255,0.3)",
    marginBottom: "40px",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse:
      "collapse",
  },

  headerCell: {
    padding: "15px",
    border:
      "1px solid #ffffff22",
    color: "#00f0ff",
    textAlign:
      "center",
  },

  cell: {
    padding: "15px",
    border:
      "1px solid #ffffff22",
    textAlign:
      "center",
  },

  breakBox: {
    border:
      "2px solid #00f0ff",
    padding: "20px",
    boxShadow:
      "0 0 20px rgba(0,240,255,0.2)",
  },

  breakTitle: {
    marginBottom: "20px",
    color: "#00f0ff",
    textAlign:
      "center",
    fontSize: "30px",
    fontFamily:
      "Papyrus",
  },
};