import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const repositoryName = env.VITE_REPOSITORY_NAME || "echoes-of-two";
  return { plugins: [react()], base: mode === "production" ? `/${repositoryName}/` : "/", build: { target: "es2022", sourcemap: false, chunkSizeWarningLimit: 3000 } };
});
