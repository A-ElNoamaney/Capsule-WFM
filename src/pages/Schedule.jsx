import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function Schedule() {
const navigate = useNavigate();

const [profile, setProfile] = useState(null);
const [schedule, setSchedule] = useState({});
const [breaks, setBreaks] = useState([]);
const [loading, setLoading] = useState(true);

//////////////////////////////////////
// Transform Schedule (Pivot)
//////////////////////////////////////
const transformSchedule = (data) => {
const result = {};
data.forEach((row) => {
result[row.date] = row.shift;
});
return result;
};

//////////////////////////////////////
// Fetch Data
//////////////////////////////////////
const fetchData = useCallback(async () => {
try {
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) return;




  //////////////////////////////////////
  // PROFILE
  //////////////////////////////////////
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileData) {
    alert("Profile not found ❌");
    return;
  }

  //////////////////////////////////////
  // SCHEDULE
  //////////////////////////////////////
  const { data: scheduleData } = await supabase
    .from("schedule")
    .select("*")
    .eq("user_id", profileData.id)
    .order("date", { ascending: true });

  //////////////////////////////////////
  // BREAKS
  //////////////////////////////////////
  const { data: breaksData, error: breaksError } = await supabase
  .from("breaks")
  .select("*")
  .eq("user_id", profileData.id);
  if (breaksError) {
  console.log(breaksError);}

  setBreaks(breaksData || []);
  setProfile(profileData);
  setSchedule(transformSchedule(scheduleData || []));
  setLoading(false);} catch (err) {
  setLoading(false);}
}, []);

useEffect(() => {
  fetchData();
}, [fetchData]);


//////////////////////////////////////
// Loading
//////////////////////////////////////
if (loading) {
return <h2 style={styles.loading}>Loading...</h2>;
}

//////////////////////////////////////
// Days ترتيب ثابت
//////////////////////////////////////

const sortedDates = Object.keys(schedule).sort();


return ( 
<div style={styles.container}> <h1 style={styles.title}>My Weekly Schedule 📅</h1>
  <div style={styles.topBar}>
    <button style={styles.btn} onClick={() => navigate("/dashboard")}>
      ← Back to Dashboard
    </button>

    <button style={styles.btn}>Export 📤</button>
  </div>

  <table style={styles.table}>
    <thead>
      <tr>
        <th style={styles.headerCell}>HR ID</th>
        <th style={styles.headerCell}>Name</th>
        <th style={styles.headerCell}>Leader</th>

        {sortedDates.map((date, i) => (
          <th key={i} style={styles.headerCell}>
            {new Date(date).toLocaleDateString("en-US", {
              weekday: "short",
            })}
          </th>
        ))}
      </tr>
    </thead>

    <tbody>
      <tr>
        <td style={styles.cell}>{profile?.hr_id || "-"}</td>
        <td style={styles.cell}>{profile?.full_name || "-"}</td>
        <td style={styles.cell}>{profile?.leader_id || "-"}</td>

        {sortedDates.map((date, i) => (
          <td key={i} style={styles.cell}>
            {schedule[date] || "-"}
          </td>
        ))}
      </tr>
    </tbody>
  </table>

  <div style={styles.breaksContainer}>
  <h2 style={styles.breaksTitle}>Breaks ☕</h2>

  <div style={styles.breakBox}>
    {breaks && breaks.length > 0 ? (
      (() => {
        const b = breaks[0]; // أول row

        return (
          <>
            <div style={styles.breakRow}>
              <span>Break 1</span>
              <span style={styles.breakTime}>
                {b.break1 || "--"}
              </span>
            </div>

            <div style={styles.breakRow}>
              <span>Break 2</span>
              <span style={styles.breakTime}>
                {b.break2 || "--"}
              </span>
            </div>

            <div style={styles.breakRow}>
              <span>Break 3</span>
              <span style={styles.breakTime}>
                {b.break3 || "--"}
              </span>
            </div>
          </>
        );
      })()
    ) : (
      <div style={styles.breakRow}>
        <span>No Breaks</span>
      </div>
    )}
  </div>
</div>
</div>


);
}

export default Schedule;

////////////////////////////////////////////////////////
// STYLES (نفس الشكل القديم)
////////////////////////////////////////////////////////
const styles = {
container: {
background: "#020617",
minHeight: "100vh",
padding: "30px",
color: "white",
fontFamily: "Comic Sans MS",
},

title: {
textAlign: "center",
color: "#22d3ee",
marginBottom: "20px",
fontSize: "32px",
fontWeight: "bold",
},

topBar: {
display: "flex",
justifyContent: "space-between",
marginBottom: "20px",
fontWeight: "bold",
},

btn: {
background: "transparent",
border: "1px solid #22d3ee",
color: "#22d3ee",
padding: "10px 15px",
borderRadius: "8px",
cursor: "pointer",
fontWeight: "bold",
},

table: {
width: "100%",
borderCollapse: "collapse",
border: "1px solid #22d3ee",
textAlign: "center",
fontWeight: "bold",
tableLayout: "fixed",
},

headerCell: {
border: "1px solid #22d3ee",
padding: "10px",
textAlign: "center",
fontWeight: "bold",
},

cell: {
  border: "1px solid #22d3ee",
  padding: "10px",
  textAlign: "center",
  verticalAlign: "middle",
  fontWeight: "bold",
},

breaksContainer: {
marginTop: "40px",
},

breaksTitle: {
  color: "#22d3ee",
  fontSize: "40px",
  fontWeight: "bold",
  textAlign: "left",
},

breakBox: {
border: "1px solid #22d3ee",
padding: "10px",
fontWeight: "bold",
},

breakRow: {
display: "flex",
justifyContent: "space-between",
borderBottom: "1px solid #0ea5e9",
padding: "10px",
fontWeight: "bold",
},

breakTime: {
color: "#22d3ee",
fontWeight: "bold",
textAlign: "center",
},

loading: {
color: "white",
textAlign: "center",
marginTop: "50px",
},
};