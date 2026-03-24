import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router";

import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
  UserButton,
} from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Add your clerk publishable key to the .env file");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <SignedOut>
            <div className="flex min-h-[80vh] items-center justify-center">
              <SignIn />
            </div>
          </SignedOut>

          <SignedIn>
            <div className="mb-8 flex justify-end">
              <UserButton />
            </div>
            <App />
          </SignedIn>
        </div>
      </div>
    </ClerkProvider>
    </BrowserRouter>
  </StrictMode>,
);
