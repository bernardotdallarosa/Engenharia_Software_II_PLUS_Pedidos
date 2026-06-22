import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
  Component,
} from "react";
import { PLUS_AUTH_LOGIN_SUCCESS_EVENT } from "./shellAuthEvents.js";

const ACCESS_TOKEN_KEY = "plus.auth.token";
const REFRESH_TOKEN_KEY = "plus.auth.refresh";

const LoginPage = lazy(() => import("mfe_auth/LoginPage"));
const PedidosPage = lazy(() => import("mfe_ped/OrdersPage"));

class RemoteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`Remote ${this.props.remoteName}:`, error, info);
  }

  render() {
    if (this.state.error) {
      const msg = this.state.error?.message || String(this.state.error);
      return (
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
          <h2>Não foi possível carregar {this.props.remoteName}</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{msg}</p>
          <p style={{ marginTop: 16, color: "#555", maxWidth: 520 }}>
            Confirme que o MFE está em execução e que o build do shell usou{" "}
            <code>MFE_AUTH_URL</code> / <code>MFE_PED_URL</code> correctos.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppLayout({ view, onNavigate, onLogout, children }) {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 24px",
          borderBottom: "1px solid #e0e0e0",
          background: "#fafafa",
        }}
      >
        <strong>Plus</strong>
        <nav style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            disabled={view === "dashboard"}
            onClick={() => onNavigate("dashboard")}
          >
            Início
          </button>
          <button
            type="button"
            disabled={view === "pedidos"}
            onClick={() => onNavigate("pedidos")}
          >
            Pedidos
          </button>
        </nav>
        <button type="button" onClick={onLogout} style={{ marginLeft: "auto" }}>
          Sair
        </button>
      </header>
      <main>{children}</main>
    </div>
  );
}

function DashboardHome() {
  return (
    <div style={{ padding: 32 }}>
      <h1>Dashboard</h1>
      <p>Bem-vindo ao sistema de gestão de estoque.</p>
      <p style={{ color: "#555" }}>
        Use o menu <strong>Pedidos</strong> para abrir o MFE7 (Pedidos).
      </p>
    </div>
  );
}

function hasStoredSession() {
  return !!localStorage.getItem(ACCESS_TOKEN_KEY);
}

function normalizeLoginPayload(data) {
  if (!data || typeof data !== "object") return null;
  const token = data.token ?? data.access_token;
  const refresh = data.refresh ?? data.refresh_token;
  if (typeof token !== "string" || !token) return null;
  return { token, refresh };
}

export default function App() {
  const [authed, setAuthed] = useState(() => hasStoredSession());
  const [view, setView] = useState("dashboard");

  const applyLoginSession = useCallback((data) => {
    const session = normalizeLoginPayload(data);
    if (!session) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, session.token);
    if (typeof session.refresh === "string" && session.refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh);
    }
    setAuthed(true);
  }, []);

  useEffect(() => {
    const onRemoteLogin = (event) => {
      applyLoginSession(event.detail);
    };
    window.addEventListener(PLUS_AUTH_LOGIN_SUCCESS_EVENT, onRemoteLogin);
    return () => {
      window.removeEventListener(PLUS_AUTH_LOGIN_SUCCESS_EVENT, onRemoteLogin);
    };
  }, [applyLoginSession]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAuthed(false);
    setView("dashboard");
  }, []);

  if (authed) {
    return (
      <AppLayout view={view} onNavigate={setView} onLogout={handleLogout}>
        {view === "pedidos" ? (
          <RemoteErrorBoundary remoteName="mfe_ped">
            <Suspense fallback={<p style={{ padding: 24 }}>Carregando pedidos…</p>}>
              <PedidosPage />
            </Suspense>
          </RemoteErrorBoundary>
        ) : (
          <DashboardHome />
        )}
      </AppLayout>
    );
  }

  return (
    <RemoteErrorBoundary remoteName="mfe_auth">
      <Suspense fallback={<p style={{ padding: 24 }}>Carregando…</p>}>
        <LoginPage onLogin={applyLoginSession} />
      </Suspense>
    </RemoteErrorBoundary>
  );
}
