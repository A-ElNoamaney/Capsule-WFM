import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import { supabase } from "../supabase";

function MainLayout({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [notifications, setNotifications] = useState([]);

  // =========================
  // Get Logged User
  // =========================

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    getUser();
  }, []);

  // =========================
  // Fetch Notifications
  // =========================

  const fetchNotifications = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setNotifications(data || []);
    }
  };

  // =========================
  // Realtime Notifications
  // =========================

  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("Realtime notification:", payload);

          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // =========================
  // Logout
  // =========================

  const handleLogout = async () => {
    await supabase.auth.signOut();

    navigate("/");
  };

  // =========================
  // Unread Count
  // =========================

  const unreadCount = notifications.filter(
    (n) => !n.is_read
  ).length;

  console.log("USER ID:", user?.id);
  console.log("NOTIFICATIONS:", notifications);
  console.log("UNREAD:", unreadCount);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#fff",
      }}
    >
      {/* ========================= */}
      {/* TOP BAR */}
      {/* ========================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px",
          borderBottom: "1px solid #ffffff22",
          fontFamily: "Papyrus",
        }}
      >
        <h2
          style={{
            color: "#00f0ff",
            margin: 0,
          }}
        >
          Capsule WFM System
        </h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >
        {/* Notification Bell */}

          <div
            style={{
              position: "relative",
              fontSize: "24px",
              cursor: "pointer",
            }}
          >
            🔔

            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-10px",
                  background: "red",
                  color: "#fff",
                  borderRadius: "50%",
                  fontSize: "12px",
                  padding: "2px 7px",
                  fontWeight: "bold",
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          {/* Logout */}

          <button
            onClick={handleLogout}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "none",
              background: "#ff4d4f",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>

      {/* ========================= */}
      {/* PAGE CONTENT */}
      {/* ========================= */}

      <div style={{ padding: "20px" }}>
        {children}
      </div>
    </div>
  );
}

export default MainLayout;