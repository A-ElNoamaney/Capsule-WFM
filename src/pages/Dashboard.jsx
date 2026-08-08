import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

import AgentDashboard from "./AgentDashboard";
import MainLayout from "../components/MainLayout";

function Dashboard() {
  const [role, setRole] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    getRole();
  }, []);

  const getRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setRole(data?.role);
  };

  if (!role) return <h2>Loading...</h2>;

  return (
    <MainLayout>

      {role === "agent" && <AgentDashboard />}

      {role === "tl" && (
        <h2 style={{ color: "white" }}>
          TL Dashboard
        </h2>
      )}

      {role === "admin" && (
        <button onClick={() => navigate("/admin-dashboard")}>
          Go To Admin Dashboard
        </button>
      )}

    </MainLayout>
  );
}

export default Dashboard;