import { createContext, useContext, useState, ReactNode } from "react";

type InterfaceModeType = "basic" | "detailed";

interface InterfaceModeContextType {
  mode: InterfaceModeType;
  setMode: (mode: InterfaceModeType) => void;
}

const InterfaceModeContext = createContext<InterfaceModeContextType>({
  mode: "basic",
  setMode: () => {},
});

export const useInterfaceMode = () => useContext(InterfaceModeContext);

export const InterfaceModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<InterfaceModeType>("basic");
  return (
    <InterfaceModeContext.Provider value={{ mode, setMode }}>
      {children}
    </InterfaceModeContext.Provider>
  );
};
