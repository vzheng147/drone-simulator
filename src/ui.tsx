import * as React from "react";
import { useState } from "react";
import Banner from "./components/Banner";
import NavBar from "./components/Navbar";
import MainContent from "./components/MainContent";
import { MosaicContext, type User, type Mosaic } from "./context/MosaicContext";
import type { MosaicContextType } from "./context/MosaicContext";
import "./ui.css";

export default function UI() {
  // Mock user data for now
  const [user, setUser] = useState<User | null>({
    name: "Sean Peppers",
    password: "p",
    mosaics: [
      {
        imageURL: "",
        name: "Field A",
        date: new Date(),
        location: "MO",
      },
      {
        imageURL: "",
        name: "Field B",
        date: new Date(),
        location: "NY",
      },
    ],
  });

  const [selectedMosaic, setSelectedMosaic] = useState<Mosaic | null>(
    user?.mosaics[0] || null
  );

  const contextValue: MosaicContextType = {
    user,
    setUser,
    selectedMosaic,
    setSelectedMosaic,
  };

  return (
    <MosaicContext.Provider value={contextValue}>
      <Banner />
      <div className="main">
        <div className="sidebar">
          <NavBar />
        </div>
        <div className="content">
          <MainContent />
        </div>
      </div>
    </MosaicContext.Provider>
  );
}
