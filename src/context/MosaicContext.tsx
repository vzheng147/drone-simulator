import { createContext, useContext } from "react";

// Types
export type NavItem = {
  id: string;
  name: string;
  date: Date;
  location: string;
  status: number; // 0 = success, 1 = warning, 2 = error
  imageUrl?: string;
};

export type ActiveTab = "mosaic-analysis" | "pre-analysis-planner";

export type MosaicContextType = {
  // Analysis items
  items: NavItem[];
  addItem: (item: Omit<NavItem, "id">) => void;
  updateItem: (id: string, updates: Partial<NavItem>) => void;

  // Selection
  selectedItem: NavItem | null;
  setSelectedItem: (item: NavItem | null) => void;

  // Active tab
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
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
