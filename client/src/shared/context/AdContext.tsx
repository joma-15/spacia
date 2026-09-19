import React, { createContext, useContext } from "react";

interface AdContextType {
  isAdVisible: boolean;
}

const AdContext = createContext<AdContextType>({
  isAdVisible: false,
});

export const AdProvider = ({
  children,
  isAdVisible,
}: {
  children: React.ReactNode;
  isAdVisible: boolean;
}) => {
  return (
    <AdContext.Provider value={{ isAdVisible }}>
      {children}
    </AdContext.Provider>
  );
};

export const useAd = () => useContext(AdContext);