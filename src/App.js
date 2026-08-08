import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import TLPerformance from "./pages/TLPerformance";
import Login from "./pages/Login";
import Schedule from "./pages/Schedule";
import ShiftSwap from "./pages/ShiftSwap";
import OffSwap from "./pages/OffSwap";
import LeaveRequest from "./pages/LeaveRequest";
import MyRequests from "./pages/MyRequests";
import Performance from "./pages/Performance";
import TLRequests from "./pages/TLRequests";
import TLSchedule from "./pages/TLSchedule";
import AgentDashboard from "./pages/AgentDashboard";
import TLDashboard from "./pages/TLDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AllEmployees from "./pages/AllEmployees";
import AllRequests from "./pages/AllRequests";
import CreateEmployee from "./pages/CreateEmployee";
import CompanySchedule from "./pages/CompanySchedule";
import CompanyPerformance from "./pages/CompanyPerformance";
import CompanyAttendance from "./pages/CompanyAttendance";
import TLAttendance from "./pages/TLAttendance";
import AgentAttendance from "./pages/AgentAttendance";
import MainLayout from "./components/MainLayout";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession();

    // 🔥 مهم جدًا (real-time auth)
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getSession();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const getSession = async () => {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    setUser(data.user);

    // 🔥 fetch profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    if (!profile) {
      console.error("No profile found");
      setLoading(false);
      return;
    }

    setRole(profile.role?.trim().toLowerCase());
    setLoading(false);
  };

  // 🔥 Protected Route
  const ProtectedRoute = ({ children }) => {
    if (loading)
      return <h2 style={{ color: "white", textAlign: "center" }}>Loading...</h2>;

    if (!user) return <Navigate to="/" />;

    if (!role)
      return (
        <h2 style={{ color: "white", textAlign: "center" }}>
          Loading Dashboard...
        </h2>
      );

    return children;
  };

  return (
    <Routes>
      {/* 🔓 Public */}
      <Route path="/" element={<Login />} />

      {/* 🔥 Dashboard */}
      <Route
  path="/dashboard"
  element={
    <ProtectedRoute>

      <MainLayout>

        {role === "agent" ? (
          <AgentDashboard />
        ) : role === "tl" ? (
          <TLDashboard />
        ) : role === "admin" ? (
          <AdminDashboard />
        ) : (
          <h2 style={{ color: "white" }}>No role found</h2>
        )}

      </MainLayout>

    </ProtectedRoute>
  }
/>

      {/* 🔒 باقي الصفحات */}
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <Schedule />
          </ProtectedRoute>
        }
      />

      <Route
        path="/shift-swap"
        element={
          <ProtectedRoute>
            <ShiftSwap />
          </ProtectedRoute>
        }
      />

      <Route
        path="/off-swap"
        element={
          <ProtectedRoute>
            <OffSwap />
          </ProtectedRoute>
        }
      />

      <Route
        path="/leave"
        element={
          <ProtectedRoute>
            <LeaveRequest />
          </ProtectedRoute>
        }
      />

      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <MyRequests />
          </ProtectedRoute>
        }
      />

    
      <Route
        path="/performance"
        element={
          <ProtectedRoute>
            <Performance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tl-requests"
        element={
          <ProtectedRoute>
            <TLRequests />
          </ProtectedRoute>
        }
      />
      <Route
  path="/tl-schedule"
  element={
    <ProtectedRoute>
      <TLSchedule />
    </ProtectedRoute>
  }
/>
<Route
  path="/tl-performance"
  element={
    <ProtectedRoute>
      <TLPerformance />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin-dashboard"
  element={
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/all-employees"
  element={
    <ProtectedRoute>
      <AllEmployees />
    </ProtectedRoute>
  }
/>
<Route
  path="/all-requests"
  element={
    <ProtectedRoute>
      <AllRequests />
    </ProtectedRoute>
  }
/>
<Route
  path="/create-employee"
  element={
    <ProtectedRoute>
      <CreateEmployee />
    </ProtectedRoute>
  }
/>
<Route
  path="/company-schedule"
  element={
    <ProtectedRoute>
      <CompanySchedule />
    </ProtectedRoute>
  }
/>

<Route
  path="/company-performance"
  element={
    <ProtectedRoute>
      <CompanyPerformance />
    </ProtectedRoute>
  }
/>
<Route
  path="/company-attendance"
  element={<CompanyAttendance />}
/>
<Route
  path="/tl-attendance"
  element={<TLAttendance />}
/>
<Route path="/agent-attendance" element={<AgentAttendance />} />
    </Routes>
    
  );
}

export default App;