import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import JoinTeam from "./pages/JoinTeam.jsx";
import Products from "./pages/Products.jsx";
import Sales from "./pages/Sales.jsx";
import Messages from "./pages/Messages.jsx";
import TeamManagement from "./pages/TeamManagement.jsx";
import Profits from "./pages/Profits.jsx";

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function LeaderRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "leader") return <Navigate to="/products" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/join" element={<JoinTeam />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/products" replace />} />
            <Route path="products" element={<Products />} />
            <Route path="sales" element={<Sales />} />
            <Route path="messages" element={<Messages />} />
            <Route
              path="team"
              element={
                <LeaderRoute>
                  <TeamManagement />
                </LeaderRoute>
              }
            />
            <Route
              path="profits"
              element={
                <LeaderRoute>
                  <Profits />
                </LeaderRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
