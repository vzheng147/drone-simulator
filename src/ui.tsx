import * as React from "react";
import Banner from "./components/Banner";
import NavBar from "./components/Navbar";
import MainContent from "./components/MainContent";
import "./ui.css";

export default function UI() {
  return (
    <>
      <Banner />
      <div className="main">
        <div className="sidebar">
          <NavBar
            items={[
              { name: "Field A", date: new Date(), location: "MO", status: 1 },
              { name: "Field B", date: new Date(), location: "NY", status: 0 },
            ]}
          />
        </div>
        <div className="content">
          <MainContent />
        </div>
      </div>
    </>
  );
}
