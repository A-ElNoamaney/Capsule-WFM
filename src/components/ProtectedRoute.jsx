import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.log("Auth Error:", error.message);
        setUser(null);
      } else {
        setUser(data.user);
      }
    };

    checkUser();
  }, []);

  if (user === undefined) {
    return <h2 style={{ color: "#fff" }}>Loading...</h2>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;