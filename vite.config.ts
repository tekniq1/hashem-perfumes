import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  const supabaseUrl =
    env["VITE_SUPABASE_URL"] || env["SUPABASE_URL"] || "https://mfsssgyapeewlyznxjiz.supabase.co";
  const supabaseKey =
    env["VITE_SUPABASE_ANON_KEY"] ||
    env["SUPABASE_ANON_KEY"] ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mc3NzZ3lhcGVld2x5em54aml6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ2NjQ0MCwiZXhwIjoyMDc2MDQyNDQwfQ.hqifzYoo9eaB840y619ab_7-VwjeOuvg3eHaUnll948";

  return {
    plugins: [
      TanStackRouterVite({
        routesDirectory: "./src/routes",
        generatedRouteTree: "./src/routeTree.gen.ts",
      }),
      tsConfigPaths(),
      tailwindcss(),
      react(),
    ],
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(supabaseKey),
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      allowedHosts: true,
    },
  };
});
