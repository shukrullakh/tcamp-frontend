import { setTokens, clearTokens, getAccessToken } from "@/lib/queryClient";
import { useState, useEffect } from "react";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!getAccessToken()
  );

  useEffect(() => {
    setIsAuthenticated(!!getAccessToken());
  }, []);

  async function login(email_or_username: string, password: string) {
    const res = await fetch("/api/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_or_username, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err));
    }

    const data = await res.json();
    setTokens(data.access, data.refresh);
    setIsAuthenticated(true);
    return data;
  }

  async function register(payload: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) {
    const res = await fetch("/api/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err));
    }

    return await res.json();
  }

  function logout() {
    clearTokens();
    setIsAuthenticated(false);
    window.location.href = "/login";
  }

  return { isAuthenticated, login, register, logout };
}
