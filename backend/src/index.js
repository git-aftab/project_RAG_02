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
