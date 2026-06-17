import { useState, useCallback } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { UnderlineField } from "../components/underline-field/underline-field";
import { AlertBanner }    from "../components/alert-banner/alert-banner";
import { useLoginForm }   from "../hooks/login/useLoginForm";
import type { LoginResponse } from "../types/auth";

const API = import.meta.env.VITE_MS_AUTH_URL || "http://localhost:3001";

interface LoginPageProps {
  onLogin?: (data: LoginResponse) => void;
}

function BackgroundBlobs() {
  const blob = (sx: object) => (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        borderRadius: "50%",
        pointerEvents: "none",
        ...sx,
      }}
    />
  );
  return (
    <>
      {blob({ top: -80, right: -80, width: 280, height: 280, background: "rgba(255,255,255,0.13)" })}
      {blob({ bottom: -100, left: -100, width: 340, height: 340, background: "rgba(255,255,255,0.10)" })}
      {blob({ bottom: 30, left: 10, width: 170, height: 170, background: "rgba(255,255,255,0.09)" })}
    </>
  );
}



export default function LoginPage({ onLogin }: LoginPageProps) {
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      setAuthError(null);
      try {
        const res = await fetch(`${API}/auth/login`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setAuthError((body as { error?: string }).error || "Usuário ou senha inválidos.");
          return;
        }

        const data: LoginResponse = await res.json();

        const tokenParaSalvar = data.access_token || data.token;
        const refreshParaSalvar = data.refresh_token || data.refresh;

        if (tokenParaSalvar) {
          localStorage.setItem("token", tokenParaSalvar);
        }

        if (refreshParaSalvar) {
          localStorage.setItem("refresh", refreshParaSalvar);
        }

        // localStorage.setItem("token",   data.access_token);
        // localStorage.setItem("refresh", data.refresh_token || "");
        onLogin?.(data);
      } catch {
        setAuthError("Erro de conexão. Verifique se o servidor está rodando.");
      }
    },
    [onLogin]
  );

  const {
    values, errors, touched, isSubmitting,
    fieldValid, handleChange, handleBlur, handleSubmit,
  } = useLoginForm({ onSubmit: handleLogin });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #7B74F5 0%, #5E56E8 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <BackgroundBlobs />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 460,
          background: "rgba(248, 248, 255, 0.93)",
          backdropFilter: "blur(16px)",
          borderRadius: "24px",
          p: { xs: "36px 28px", sm: "48px 52px" },
          boxShadow: "0 8px 48px rgba(70, 60, 200, 0.22)",
          overflow: "hidden",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute", top: -50, right: -50,
            width: 170, height: 170,
            borderRadius: "50%",
            background: "rgba(108, 99, 255, 0.07)",
            pointerEvents: "none",
          }}
        />

        <Typography
          variant="h4"
          align="center"
          fontWeight={700}
          sx={{ color: "#4a42c8", mb: 0.75, fontSize: { xs: "1.6rem", sm: "1.9rem" } }}
        >
          Entrar
        </Typography>
        <Typography align="center" sx={{ color: "#9898b3", fontSize: "0.875rem", mb: 3 }}>
          Bem-vindo de volta!
        </Typography>

        <AlertBanner
          message={authError}
          severity="error"
          onClose={() => setAuthError(null)}
        />

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Stack spacing={3.5}>

            <UnderlineField
              id="email"
              label="E-mail"
              type="email"
              value={values.email}
              onChange={handleChange("email")}
              onBlur={handleBlur("email")}
              error={Boolean(touched.email && errors.email)}
              helperText={errors.email}
              autoComplete="email"
              autoFocus
              endAdornment={
                fieldValid("email")
                  ? <CheckCircleIcon sx={{ color: "#6C63FF", fontSize: 20 }} />
                  : null
              }
            />

            <UnderlineField
              id="password"
              label="Senha"
              type="password"
              value={values.password}
              onChange={handleChange("password")}
              onBlur={handleBlur("password")}
              error={Boolean(touched.password && errors.password)}
              helperText={errors.password}
              autoComplete="current-password"
              endAdornment={
                fieldValid("password")
                  ? <CheckCircleIcon sx={{ color: "#6C63FF", fontSize: 20 }} />
                  : null
              }
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting}
              sx={{
                py: "13px",
                borderRadius: 50,
                fontWeight: 700,
                fontSize: "0.9375rem",
                background: "linear-gradient(90deg, #6C63FF 0%, #7B74F5 100%)",
                boxShadow: "0 4px 20px rgba(108, 99, 255, 0.4)",
                "&:hover": {
                  background: "linear-gradient(90deg, #5A52E0 0%, #6C63FF 100%)",
                  boxShadow: "0 6px 28px rgba(108, 99, 255, 0.5)",
                },
                "&.Mui-disabled": { opacity: 0.7, color: "#fff" },
              }}
            >
              {isSubmitting && (
                <CircularProgress size={16} color="inherit" sx={{ mr: 1.25 }} />
              )}
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </Stack>
        </Box>

        <Typography align="center" sx={{ mt: 3.5, fontSize: "0.875rem", color: "#9898b3" }}>
          Não tem uma conta?{" "}
          <Link
            href="/register"
            sx={{
              color: "#6C63FF",
              fontWeight: 700,
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Criar conta
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}