import { Box, Button, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <>
    <Box
      sx={{
        minHeight: "100vh", 
        width: "100vw",  
        display: "flex",
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center", 
        textAlign: "center",
        background: "linear-gradient(135deg, #e3f2fd, #fce4ec)", 
        px: 2,
      }}
    >
      <Container maxWidth="md">
      
        <Typography variant="h2" fontWeight="bold" gutterBottom>
          🚀 Welcome to Gojs Flow Builder
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Design, save, and manage your custom flows with ease.
        </Typography>

       
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{ mr: 2 }}
            onClick={() => navigate("/create")}
          >
            Create New Flow
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            onClick={() => navigate("/flows")}
          >
            View Saved Flows
          </Button>
        </Box>
      </Container>
    </Box>
    </>
  );
}
