import { useState } from "react";
import AnalysisPlanner from "./AnalysisPlanner";
import MosaicAnalysis from "./MosaicAnalysis";
import "./MainContent.css";

function MainContent() {
  const [activeTab, setActiveTab] = useState("planner");
  return (
    <div>
      <div className="tab-container">
        <button
          className={`tab-button ${activeTab === "planner" ? "active" : ""}`}
          onClick={() => setActiveTab("planner")}
        >
          Pre-Analysis Planner
        </button>
        <button
          className={`tab-button ${activeTab === "mosaic" ? "active" : ""}`}
          onClick={() => setActiveTab("mosaic")}
        >
          Mosaic Analysis
        </button>
      </div>

      <div className="content-area">
        {activeTab === "planner" && <AnalysisPlanner />}
        {activeTab === "mosaic" && <MosaicAnalysis />}
      </div>
    </div>
  );
}

export default MainContent;
