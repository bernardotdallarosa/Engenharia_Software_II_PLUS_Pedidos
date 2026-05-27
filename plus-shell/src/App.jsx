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

class RemoteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Remote mfe_auth:", error, info);
  }

  render() {
    if (this.state.error) {
      const msg = this.state.error?.message || String(this.state.error);
      return (
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
          <h2>Não foi possível carregar o login</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{msg}</p>
          <p style={{ marginTop: 16, color: "#555", maxWidth: 520 }}>
            Confirme que o MFE está em execução (ex.:{" "}
            <code>http://localhost:4001/assets/remoteEntry.js</code>) e que o
            build do shell usou <code>MFE_AUTH_URL</code> correcto.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function Dashboard({ onLogout }) {
  return (
    <div style={{ padding: 32, fontFamily: "system-ui, sans-serif" }}>
      <h1>Plus — Dashboard</h1>
      <p>Bem-vindo ao sistema de gestão de estoque.</p>
      <button type="button" onClick={onLogout}>
        Sair
      </button>
    </div>
  );
}

function hasStoredSession() {
  return !!localStorage.getItem(ACCESS_TOKEN_KEY);
}

export default function App() {
  const [authed, setAuthed] = useState(() => hasStoredSession());

  const applyLoginSession = useCallback((data) => {
    const t = data?.token;
    const r = data?.refresh;
    if (typeof t !== "string" || !t) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, t);
    if (typeof r === "string" && r) {
      localStorage.setItem(REFRESH_TOKEN_KEY, r);
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
  }, []);

  if (authed) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <RemoteErrorBoundary>
      <Suspense fallback={<p style={{ padding: 24 }}>Carregando…</p>}>
        <LoginPage onLogin={applyLoginSession} />
      </Suspense>
    </RemoteErrorBoundary>
  );
}
