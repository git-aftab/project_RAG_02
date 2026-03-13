import { supabase } from "../config/supabase.js";

export const connectDB = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Supabase connection failed:", error.message);
    }

    console.log("Supabase Connection Established Successfully");
    // console.log("data:",data)
  } catch (error) {
    console.error("Unexpected error:", error.message);
  }
};

// connectDB()

// test-supabase.js (in backend/ folder)
// import dotenv from 'dotenv';
// dotenv.config();

// import { createClient } from "@supabase/supabase-js";

// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_ANON_KEY
// );

// async function test() {
//   console.log("Testing Supabase connection...");
  
//   const { data, error } = await supabase
//     .from("chunks")
//     .select("id")
//     .limit(1);
  
//   if (error) {
//     console.error("❌ Connection failed:", error.message);
//   } else {
//     console.log("✅ Connection successful!");
//     console.log("Data:", data);
//   }
// }

// test();