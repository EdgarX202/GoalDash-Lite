import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router";
import { API_BASE_URL } from "./config";
import type { User } from "./types";
import GoalsPage from "./GoalsPage";
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import "./App.css";

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function checkSession() {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: "include",
          signal: controller.signal,
        });

        if (response.status === 401) {
          setUser(null);
          return;
        }

        if (!response.ok) {
          throw new Error("Could not check your session.");
        }

        const currentUser: User = await response.json();
        setUser(currentUser);
      } catch {
        if (!controller.signal.aborted) {
          setSessionError(
            "Could not connect to your account. Check the backend and retry.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => controller.abort();
  }, []);

  async function signOut() {
    setSigningOut(true);
    setLogoutError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Could not sign out.");
      }

      setUser(null);
      navigate("/login", { replace: true });
    } catch {
      setLogoutError("Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  if (checkingSession) {
    return <main className="auth-page" role="status">Checking your session…</main>;
  }

  if (sessionError) {
    return (
      <main className="auth-page">
        <p role="alert">{sessionError}</p>
        <button
          className="new-goal-button"
          type="button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </main>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              onSignedIn={(signedInUser) => {
                setUser(signedInUser);
                navigate("/", { replace: true });
              }}
            />
          }
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <nav className="main-navigation" aria-label="Main navigation">
        <span className="navigation-brand">GoalDash Lite</span>

        <div className="navigation-links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/goals">Goals</NavLink>
        </div>

        <div className="account-navigation">
          <span>{user.display_name}</span>
          <button
            type="button"
            disabled={signingOut}
            onClick={signOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </nav>

      {logoutError && (
        <p className="account-message" role="alert">{logoutError}</p>
      )}

      <Routes>
        <Route
          path="/"
          element={<HomePage onViewGoals={() => navigate("/goals")} />}
        />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route
          path="*"
          element={
            <main className="home-page">
              <h1>Page not found</h1>
              <Link to="/">Return home</Link>
            </main>
          }
        />
      </Routes>
    </>
  );
}