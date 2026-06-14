import { defineManifest } from "@crxjs/vite-plugin";

function toMatchPattern(rawUrl: string | undefined, fallback: string): string {
  try {
    return `${new URL(rawUrl ?? fallback).origin}/*`;
  } catch {
    return fallback;
  }
}

const apiMatch = toMatchPattern(process.env.VITE_API_URL, "http://localhost:5000/*");
const webMatch = toMatchPattern(process.env.VITE_WEB_URL, "http://localhost:5173/*");

export default defineManifest({
  manifest_version: 3,
  name: "LinkAI - LinkedIn Assistant",
  description: "AI-powered LinkedIn assistant. Supercharge your professional presence.",
  version: "1.0.0",
  permissions: ["storage", "tabs", "activeTab", "cookies", "scripting", "sidePanel", "identity"],
  host_permissions: [
    "https://www.linkedin.com/*",
    apiMatch,
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
  options_page: "src/options/index.html",
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
      webMatch,
      "http://localhost:5173/*",
      "http://127.0.0.1:5173/*",
      "http://localhost:5000/*",
    ],
  },
});
