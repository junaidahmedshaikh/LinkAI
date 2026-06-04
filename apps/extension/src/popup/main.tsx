import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NotificationToast } from "@/components/ui/NotificationToast";
import PopupApp from "./PopupApp";
import "@/styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <PopupApp />
        <NotificationToast />
      </ErrorBoundary>
    </Provider>
  </StrictMode>
);
