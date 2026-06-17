import { createTheme } from "@mui/material/styles";

const PURPLE      = "#6C63FF";
const PURPLE_DARK = "#5A52E0";
const PURPLE_LIGHT = "#EAE9FF";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main:          PURPLE,
      dark:          PURPLE_DARK,
      light:         PURPLE_LIGHT,
      contrastText:  "#ffffff",
    },
    background: {
      default: PURPLE,      
      paper:   "#ffffff",
    },
    text: {
      primary:   "#3d3d6b",
      secondary: "#9898b3",
    },
    divider: "#e8e8f0",
    error:   { main: "#e05252" },
    success: { main: PURPLE  },
  },

  typography: {
    fontFamily: '"Nunito", "Inter", "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
  },

  shape: { borderRadius: 12 },

  components: {
    MuiInput: {
      styleOverrides: {
        root: {
          fontSize: "0.9375rem",
          color: "#3d3d6b",
          "&::before":                          { borderBottomColor: "#d0d0e8" },
          "&:hover:not(.Mui-disabled)::before": { borderBottomColor: PURPLE },
          "&::after":                           { borderBottomColor: PURPLE },
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "#9898b3",
          "&.Mui-focused": { color: PURPLE },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
          fontSize: "0.9375rem",
          letterSpacing: "0.02em",
          boxShadow: "none",
          "&:hover":  { boxShadow: "none" },
          "&:active": { boxShadow: "none" },
        },
        contained: {
          borderRadius: 50,
          padding: "12px 24px",
        },
        outlined: {
          borderRadius: 50,
          padding: "10px 24px",
          borderColor: "#e0e0f0",
          color: PURPLE,
          fontWeight: 600,
          backgroundColor: "#ffffff",
          "&:hover": { borderColor: PURPLE, backgroundColor: "#f5f5ff" },
        },
      },
    },

    MuiAlert: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
  },
});