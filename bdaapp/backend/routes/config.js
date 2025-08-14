import dotenv from "dotenv";
dotenv.config();

app.get("/api-ke", (req, res) => {
  // .env at project root: VITE_QO_API_KEY=bearer your-real-key-here
  res.json({ key: process.env.VITE_QO_API_KEY });
}); 
