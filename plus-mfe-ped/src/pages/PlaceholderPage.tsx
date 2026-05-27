import { Box, Typography } from "@mui/material";

export default function PlaceholderPage() {
  return (
    <Box sx={{ p: 4, maxWidth: 560 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Pedidos — Plus
      </Typography>
      <Typography color="text.secondary">
        Microfrontend de pedidos (MFE7). Telas de venda e listagem serão
        implementadas após validação do contrato OpenAPI do microsserviço.
      </Typography>
    </Box>
  );
}
