import dotenv from "dotenv";
dotenv.config();

console.log("🔍 Environment Check:");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log(
  "SUPABASE_KEY:",
  process.env.SUPABASE_API_KEY?.substring(0, 30) + "...",
);
console.log(
  "OPENROUTER_KEY:",
  process.env.OPENROUTER_API_KEY?.substring(0, 20) + "...",
);
import { connectDB } from "./db/test.db.js";
import app from "./app.js";

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`App is listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Supabase Connection Error", err.message);
    process.exit(1);
  });
