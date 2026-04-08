import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router";
import { AccountsToolbar, OptionalAuthProvider } from "./auth";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OptionalAuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <div className="mx-auto max-w-5xl px-6 py-6">
            <AccountsToolbar />
            <App />
          </div>
        </div>
      </BrowserRouter>
    </OptionalAuthProvider>
  </StrictMode>,
);
