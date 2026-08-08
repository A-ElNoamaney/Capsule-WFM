import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function CreateEmployee() {
  const navigate = useNavigate();

  const [fullName, setFullName] =
    useState("");
  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [hrId, setHrId] =
    useState("");
  const [role, setRole] =
    useState("agent");
  const [leaderId, setLeaderId] =
    useState("");

  const [leaders, setLeaders] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  //////////////////////////////////////
  // fetch team leaders
  //////////////////////////////////////
  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    const { data } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("role", "tl");

    setLeaders(data || []);
  };

  //////////////////////////////////////
  // create employee
  //////////////////////////////////////
  const handleCreate =
    async () => {
      if (
        !fullName ||
        !email ||
        !password ||
        !hrId
      ) {
        alert(
          "Please fill all fields"
        );
        return;
      }

      try {
        setLoading(true);

        //////////////////////////////////////
        // create auth account
        //////////////////////////////////////
        const {
          data,
          error,
        } =
          await supabase.auth.signUp({
            email,
            password,
          });

        if (error) {
          alert(error.message);
          setLoading(false);
          return;
        }

        const user =
          data.user;

        //////////////////////////////////////
        // create profile
        //////////////////////////////////////
        const {
          error:
            profileError,
        } =
          await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              full_name:
                fullName,
              email,
              hr_id:
                Number(hrId),
              role,
              leader_id:
                role ===
                "agent"
                  ? leaderId
                  : null,
            });

        if (
          profileError
        ) {
          alert(
            profileError.message
          );
          setLoading(false);
          return;
        }

        //////////////////////////////////////
        // logout created user session
        //////////////////////////////////////
        await supabase.auth.signOut();

        alert(
          "Employee Created Successfully ✅"
        );

        // reset form
        setFullName("");
        setEmail("");
        setPassword("");
        setHrId("");
        setRole(
          "agent"
        );
        setLeaderId("");

      } catch (err) {
        console.log(
          err
        );
      }

      setLoading(false);
    };

  return (
    <div style={styles.container}>
      
      {/* top */}
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
          Create Employee ➕
        </h1>
      </div>

      {/* form */}
      <div style={styles.formBox}>
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) =>
            setFullName(
              e.target.value
            )
          }
          style={styles.input}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          style={styles.input}
        />

        <input
          type="number"
          placeholder="HR ID"
          value={hrId}
          onChange={(e) =>
            setHrId(
              e.target.value
            )
          }
          style={styles.input}
        />

        {/* role */}
        <select
          value={role}
          onChange={(e) =>
            setRole(
              e.target.value
            )
          }
          style={styles.input}
        >
          <option value="agent">
            Agent
          </option>

          <option value="tl">
            Team Leader
          </option>

          <option value="admin">
            Admin
          </option>
        </select>

        {/* leader */}
        {role ===
          "agent" && (
          <select
            value={
              leaderId
            }
            onChange={(
              e
            ) =>
              setLeaderId(
                e.target
                  .value
              )
            }
            style={
              styles.input
            }
          >
            <option value="">
              Select Team
              Leader
            </option>

            {leaders.map(
              (
                leader
              ) => (
                <option
                  key={
                    leader.id
                  }
                  value={
                    leader.full_name
                  }
                >
                  {
                    leader.full_name
                  }
                </option>
              )
            )}
          </select>
        )}

        <button
          style={styles.createBtn}
          onClick={
            handleCreate
          }
          disabled={
            loading
          }
        >
          {loading
            ? "Creating..."
            : "Create Employee"}
        </button>
      </div>
    </div>
  );
}

export default CreateEmployee;

//////////////////////////////////////////////////
// styles
//////////////////////////////////////////////////

const styles = {
  container: {
    minHeight:
      "100vh",
    background:
      "linear-gradient(135deg,#020617,#0f172a)",
    color: "#fff",
    padding: "30px",
    fontFamily:
      "Comic Sans MS",
  },

  topBar: {
    display: "flex",
    justifyContent:
      "space-between",
    marginBottom:
      "30px",
  },

  title: {
    color:
      "#00f0ff",
  },

  backBtn: {
    border:
      "1px solid #00f0ff",
    background:
      "transparent",
    color:
      "#00f0ff",
    padding:
      "10px 20px",
    borderRadius:
      "10px",
    cursor:
      "pointer",
  },

  formBox: {
    width: "500px",
    margin: "auto",
    display:
      "flex",
    flexDirection:
      "column",
    gap: "20px",
    padding:
      "30px",
    border:
      "1px solid #00f0ff",
    borderRadius:
      "15px",
    boxShadow:
      "0 0 20px #00f0ff22",
  },

  input: {
    padding:
      "14px",
    border:
      "1px solid #00f0ff",
    background:
      "transparent",
    color:
      "#3687d3",
    borderRadius:
      "10px",
    outline:
      "none",
  },

  createBtn: {
    padding:
      "14px",
    background:
      "#22c55e",
    border:
      "none",
    color:
      "#fff",
    borderRadius:
      "10px",
    cursor:
      "pointer",
    fontWeight:
      "bold",
  },
};