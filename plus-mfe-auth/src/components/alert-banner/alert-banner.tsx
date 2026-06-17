import { Alert, Collapse } from "@mui/material";

interface AlertBannerProps {
  message:   string | null;
  severity?: "error" | "success" | "warning" | "info";
  onClose?:  () => void;
}

export function AlertBanner({ message, severity = "error", onClose }: AlertBannerProps) {
  return (
    <Collapse in={Boolean(message)} unmountOnExit>
      <Alert
        severity={severity}
        onClose={onClose}
        sx={{
          borderRadius: "10px",
          fontSize: "0.8125rem",
          mb: 2,
          alignItems: "center",
          py: 0.75,
          "& .MuiAlert-icon":    { fontSize: "1rem" },
          "& .MuiAlert-message": { lineHeight: 1.4  },
        }}
      >
        {message}
      </Alert>
    </Collapse>
  );
}