import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "LinkAI — LinkedIn Assistant",
  description: "AI-powered LinkedIn assistant. Supercharge your professional presence.",
  version: "1.0.0",
  permissions: ["storage", "tabs", "activeTab", "cookies", "scripting", "sidePanel", "identity"],
  host_permissions: [
    "https://www.linkedin.com/*",
    "http://localhost:5000/*",
    "http://localhost:5173/*",
    "http://localhost:5174/*",
  ],
  action: {
    default_title: "LinkAI",
    default_popup: "src/popup/index.html",
  },
  side_panel: {
    default_path: "src/sidepanel/index.html",
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["https://www.linkedin.com/*"],
      js: ["src/content/index.ts"],
      run_at: "document_idle",
    },
  ],
  externally_connectable: {
    matches: [
      "http://localhost:5173/*",
      "http://127.0.0.1:5173/*",
      "http://localhost:5000/*",
    ],
  },
});
