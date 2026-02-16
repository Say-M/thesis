"use client";

import { createContext, useContext } from "react";
import { useConfig } from "@/hooks/api/config";
import type { ConfigData } from "@/hooks/api/config";
interface ConfigContextType {
  config: ConfigData | null;
  isConfigLoading: boolean;
  refetchConfig: () => Promise<unknown>;
}

export const ConfigContext = createContext<ConfigContextType>({
  config: null,
  isConfigLoading: false,
  refetchConfig: async () => {},
});

export function useConfigContext() {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error("useConfigContext must be used within ConfigProvider");
  }
  return ctx;
}

export default function ConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, isLoading, refetch } = useConfig();

  const config = data?.data?.config ?? null;

  return (
    <ConfigContext.Provider
      value={{
        config,
        isConfigLoading: isLoading,
        refetchConfig: refetch,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}
