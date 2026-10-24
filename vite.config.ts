import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ command, mode }) => {
  // Échec immédiat au build plutôt qu'un site publié qui n'atteint aucune API.
  if (command === "build" && !loadEnv(mode, process.cwd()).VITE_API_BASE_URL) {
    throw new Error(
      "VITE_API_BASE_URL doit être défini pour construire le front (voir .env.example).",
    );
  }
  return {
    plugins: [tsConfigPaths(), tailwindcss(), tanstackStart(), nitro(), viteReact()],
  };
});
