import { supabase } from "../config/supabase.js";

export const connectDB = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Supabase connection failed:", error.message);
    }

    console.log("Supabase Connection Established Successfully");
  } catch (error) {
    console.error("Unexpected error:", error.message);
  }
};
