import { useEffect } from "react";
import { Box, Typography, Button, Zoom } from "@mui/material";
//import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// Importe o BackgroundBlobs que você já tem nos outros arquivos
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
  ); }

export default function SuccessPage() {
  useEffect(() => {
    // Redireciona para o Dashboard (Shell) após 3 segundos
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #7B74F5 0%, #5E56E8 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden", p: 2
    }}>
      <BackgroundBlobs />
      
      <Zoom in style={{ transitionDelay: '200ms' }}>
        <Box sx={{
          position: "relative", zIndex: 1, width: "100%", maxWidth: 400,
          background: "rgba(248, 248, 255, 0.93)", backdropFilter: "blur(16px)",
          borderRadius: "24px", p: 6, textAlign: "center",
          boxShadow: "0 8px 48px rgba(70, 60, 200, 0.22)",
        }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: "#6C63FF", mb: 2 }} />
          
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ fontWeight: 700, color: "#4a42c8" }}
          >
            Login realizado!
          </Typography>
          
          <Typography color="#9898b3" sx={{ mb: 4 }}>
            Bem-vindo ao Plus Gestão. <br /> Redirecionando você para o estoque...
          </Typography>

          <Button 
            variant="contained" 
            fullWidth
            onClick={() => window.location.href = "/"}
            sx={{ borderRadius: 50, py: 1.5, background: "linear-gradient(90deg, #6C63FF 0%, #7B74F5 100%)" }}
          >
            Entrar agora
          </Button>
        </Box>
      </Zoom>
    </Box>
  );
}