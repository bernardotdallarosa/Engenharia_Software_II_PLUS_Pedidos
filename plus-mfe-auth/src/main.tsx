import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./styles";
import LoginPage from "./pages/LoginPage";
import type { LoginResponse } from "./types/auth";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LoginPage
        onLogin={(data: LoginResponse) => console.log("Logado:", data)}
      />
    </ThemeProvider>
  </React.StrictMode>
);