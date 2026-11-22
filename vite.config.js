import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Seules les variables préfixées VITE_ sont exposées au navigateur.
// SUPABASE_SECRET_KEY (sans VITE_) reste donc privée.
export default defineConfig({ plugins: [react()] });
