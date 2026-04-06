import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/clerk-react";
import { useCallback, type PropsWithChildren } from "react";
import {
  disabledAuthContext,
  OptionalAuthContext,
  useOptionalAuth,
} from "./auth-context";

function ClerkAuthBridge({ children }: PropsWithChildren) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getAuthToken = useCallback(() => getToken(), [getToken]);

  return (
    <OptionalAuthContext.Provider
      value={{
        accountsAvailable: true,
        isReady: isLoaded,
        isSignedIn: Boolean(isSignedIn),
        getToken: getAuthToken,
      }}
    >
      {children}
    </OptionalAuthContext.Provider>
  );
}

export function OptionalAuthProvider({ children }: PropsWithChildren) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <OptionalAuthContext.Provider value={disabledAuthContext}>
        {children}
      </OptionalAuthContext.Provider>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}

export function AccountsToolbar() {
  const { accountsAvailable, isReady, isSignedIn } = useOptionalAuth();

  return (
    <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            Notes Mode
          </p>
          {!accountsAvailable ? (
            <p className="text-sm text-slate-300">
              Accounts are disabled in this environment. Notes stay local to
              this browser.
            </p>
          ) : !isReady ? (
            <p className="text-sm text-slate-300">
              Loading account options...
            </p>
          ) : isSignedIn ? (
            <p className="text-sm text-slate-300">
              Signed in. Your notes are stored in your account.
            </p>
          ) : (
            <p className="text-sm text-slate-300">
              Using local notes on this device. Sign in to use account-backed
              notes instead.
            </p>
          )}
        </div>

        {accountsAvailable && isReady ? (
          <div className="flex flex-wrap items-center gap-3">
            {isSignedIn ? (
              <UserButton />
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-400 hover:text-sky-200">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500">
                    Create Account
                  </button>
                </SignUpButton>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
