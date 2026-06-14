import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "../store";
import { OptionsApp } from "./OptionsApp";
import "../styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <OptionsApp />
    </Provider>
  </StrictMode>
);
