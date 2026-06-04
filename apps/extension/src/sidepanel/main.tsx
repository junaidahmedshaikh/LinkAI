import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NotificationToast } from "@/components/ui/NotificationToast";
import SidePanelApp from "./SidePanelApp";
import "@/styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <SidePanelApp />
        <NotificationToast />
      </ErrorBoundary>
    </Provider>
  </StrictMode>
);
