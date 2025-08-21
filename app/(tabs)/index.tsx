// app/index.tsx
import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

export default function AppIndex() {
  const { user, loading } = useAuth();

  if (loading) return null; // ou um splash

  // logado -> /home ; não logado -> /login
  return <Redirect href={user ? "/home" : "/login"} />;
}
