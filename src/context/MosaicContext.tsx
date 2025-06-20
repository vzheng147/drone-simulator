import { createContext, useContext } from "react";

// Types
export type Mosaic = {
  imageURL: string;
  name: string;
  date: Date;
  location: string;
};

export type User = {
  mosaics: Mosaic[];
  name: string;
  password: string;
};

export type MosaicContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  selectedMosaic: Mosaic | null;
  setSelectedMosaic: (mosaic: Mosaic | null) => void;
};

// Context
export const MosaicContext = createContext<MosaicContextType | undefined>(
  undefined
);

// Custom hook
export const useMosaicContext = () => {
  const context = useContext(MosaicContext);
  if (!context) {
    throw new Error("useMosaicContext must be used within a MosaicProvider");
  }
  return context;
};
