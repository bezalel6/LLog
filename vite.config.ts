import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // {
    //   name: "set-headers",
    //   configureServer(server) {
    //     return () => {
    //       server.middlewares.use((req, res, next) => {
    //         res.setHeader(
    //           "Cross-Origin-Opener-Policy",
    //           "cross-origin allow-popups"
    //         );
    //         next();
    //       });
    //     };
    //   },
    // },
  ],
});
