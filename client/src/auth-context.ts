import { createContext, useContext } from "react";

export type OptionalAuthContextValue = {
  accountsAvailable: boolean;
  isReady: boolean;
  isSignedIn: boolean;
  getToken: () => Promise<string | null>;
};

export const disabledAuthContext: OptionalAuthContextValue = {
  accountsAvailable: false,
  isReady: true,
  isSignedIn: false,
  getToken: async () => null,
};

export const OptionalAuthContext =
  createContext<OptionalAuthContextValue>(disabledAuthContext);

export function useOptionalAuth() {
  return useContext(OptionalAuthContext);
}
