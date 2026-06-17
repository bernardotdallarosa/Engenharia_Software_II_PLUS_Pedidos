import { useState, useCallback } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Link,
  Stack,
  Typography,
} from "@mui/material";

import { UnderlineField } from "../components/underline-field/underline-field";
import { AlertBanner } from "../components/alert-banner/alert-banner";
import { useRegisterForm } from "../hooks/register/useRegisterForm";

const API = import.meta.env.VITE_MS_AUTH_URL || "http://localhost:3001";

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

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);

  const handleRegister = useCallback(async (formValues: any) => {
    setServerError(null);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: formValues.email, 
          password: formValues.password 
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.log("Erro do Servidor:", data);

        let errorMessage = "Erro ao criar conta.";

        if (data && data.detail) {
          if (Array.isArray(data.detail) && data.detail[0]?.msg) {
            errorMessage = String(data.detail[0].msg);
          } else if (typeof data.detail === "string") {
            errorMessage = data.detail;
          } else {
            errorMessage = JSON.stringify(data.detail); // Fallback se for um objeto estranho
          }
        }

        setServerError(errorMessage);
        return;
      }
      
      window.location.href = "/login?registered=true";
    } catch {
      setServerError("Erro de conexão. Verifique se o servidor está rodando.");
    }
  }, []);

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit } = 
    useRegisterForm({ onSubmit: handleRegister });

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
          sx={{ color: "#4a42c8", fontWeight: 700, mb: 0.75, fontSize: { xs: "1.6rem", sm: "1.9rem" } }}
        >
          Criar Conta
        </Typography>
        <Typography align="center" sx={{ color: "#9898b3", fontSize: "0.875rem", mb: 3 }}>
          Junte-se a nós!
        </Typography>

        <AlertBanner
          message={serverError}
          severity="error"
          onClose={() => setServerError(null)}
        />

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
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
            />

            <UnderlineField
              id="confirmPassword"
              label="Confirmar Senha"
              type="password"
              value={values.confirmPassword}
              onChange={handleChange("confirmPassword")}
              onBlur={handleBlur("confirmPassword")}
              error={Boolean(touched.confirmPassword && errors.confirmPassword)}
              helperText={errors.confirmPassword}
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
              {isSubmitting ? "Criando conta..." : "Cadastrar"}
            </Button>
          </Stack>
        </Box>

        <Typography align="center" sx={{ mt: 3.5, fontSize: "0.875rem", color: "#9898b3" }}>
          Já tem uma conta?{" "}
          <Link
            href="/login"
            sx={{
              color: "#6C63FF",
              fontWeight: 700,
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Entrar
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}