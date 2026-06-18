import { defineManifest } from "@crxjs/vite-plugin";

function toMatchPattern(rawUrl: string | undefined, fallback: string): string {
  try {
    return `${new URL(rawUrl ?? fallback).origin}/*`;
  } catch {
    return fallback;
  }
}

const isDev = process.env.NODE_ENV !== "production";
const apiUrl = process.env.VITE_API_URL;
const webUrl = process.env.VITE_WEB_URL;

const apiMatch = toMatchPattern(apiUrl, "http://localhost:5000/*");
const webMatch = toMatchPattern(webUrl, "http://localhost:5173/*");

const hostPermissions = ["https://www.linkedin.com/*", apiMatch];
const externalMatches = [webMatch];

if (isDev) {
  hostPermissions.push(
    "http://localhost:5173/*",
    "http://127.0.0.1:5173/*",
    "http://localhost:5174/*",
    "http://127.0.0.1:5174/*",
    "http://localhost:5000/*",
    "http://127.0.0.1:5000/*"
  );
  externalMatches.push(
    "http://localhost:5173/*",
    "http://127.0.0.1:5173/*",
    "http://localhost:5000/*"
  );
}

export default defineManifest({
  manifest_version: 3,
  name: "LinkAI - LinkedIn Assistant",
  description: "AI-powered LinkedIn assistant. Supercharge your professional presence.",
  version: "1.0.0",
  permissions: ["storage", "tabs", "activeTab", "sidePanel", "alarms"],
  host_permissions: hostPermissions,
  icons: {
    16: "public/icons/icon-16.png",
    32: "public/icons/icon-32.png",
    48: "public/icons/icon-48.png",
    128: "public/icons/icon-128.png",
  },
  action: {
    default_title: "LinkAI",
    default_popup: "src/popup/index.html",
    default_icon: {
      16: "public/icons/icon-16.png",
      32: "public/icons/icon-32.png",
      48: "public/icons/icon-48.png",
      128: "public/icons/icon-128.png",
    },
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
    matches: externalMatches,
  },
  web_accessible_resources: [
    {
      matches: ["https://www.linkedin.com/*"],
      resources: ["assets/*"],
      use_dynamic_url: true,
    },
  ],
});
