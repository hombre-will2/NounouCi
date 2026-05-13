import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NannyProfileEdit from "./pages/NannyProfileEdit";
import ParentProfileEdit from "./pages/ParentProfileEdit";
import SearchNannies from "./pages/SearchNannies";
import NannyDetail from "./pages/NannyDetail";
import SearchParents from "./pages/SearchParents";
import ParentDetail from "./pages/ParentDetail";
import MatchesPage from "./pages/MatchesPage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminAds from "./pages/AdminAds";
import AdminUsers from "./pages/AdminUsers";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="font-heading text-lg text-terracotta">Chargement...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <div className="App bg-paper min-h-screen">
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search" element={<SearchNannies />} />
            <Route path="/nounous/:id" element={<NannyDetail />} />
            <Route
              path="/familles"
              element={
                <ProtectedRoute>
                  <SearchParents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/familles/:id"
              element={
                <ProtectedRoute>
                  <ParentDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/nanny"
              element={
                <ProtectedRoute>
                  <NannyProfileEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/parent"
              element={
                <ProtectedRoute>
                  <ParentProfileEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matches"
              element={
                <ProtectedRoute>
                  <MatchesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/ads"
              element={
                <ProtectedRoute>
                  <AdminAds />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
