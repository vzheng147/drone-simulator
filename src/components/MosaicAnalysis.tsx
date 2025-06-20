import { useState } from "react";
import NorthOutlinedIcon from "@mui/icons-material/NorthOutlined";
import SouthOutlinedIcon from "@mui/icons-material/SouthOutlined";
import EastOutlinedIcon from "@mui/icons-material/EastOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useMosaicContext, type Mosaic } from "../context/MosaicContext";
import UploadModal from "./UploadModal";
import "./MosaicAnalysis.css";

function MosaicAnalysis() {
  const { user, setUser, selectedMosaic, setSelectedMosaic } =
    useMosaicContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpload = () => {
    setIsModalOpen(true);
  };

  const handleModalSubmit = (
    mosaicData: Omit<Mosaic, "imageURL">,
    file: File
  ) => {
    if (user) {
      const newMosaic: Mosaic = {
        ...mosaicData,
        imageURL: URL.createObjectURL(file),
      };

      // Add new mosaic to user's mosaics array
      const updatedUser = {
        ...user,
        mosaics: [newMosaic, ...user.mosaics],
      };

      setUser(updatedUser);
      setSelectedMosaic(newMosaic);
    }
  };

  // Use selected mosaic or show placeholder
  const displayMosaic = selectedMosaic || {
    name: "No Analysis Selected",
    date: new Date(),
    location: "Unknown",
    imageURL: "",
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString();
  };

  // Real analysis data from the mosaic
  const analysisData = selectedMosaic
    ? {
        vegetation: 0.68,
        waterStress: 0.45,
        nitrogenLevel: 0.55,
      }
    : null;

  return (
    <div className="layout">
      <div className="upper">
        <div>Mosaic Analysis</div>

        <button onClick={handleUpload}>
          <FileUploadOutlinedIcon />
          Upload Mosaic
        </button>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      <div className="bottom">
        <div className="bottomLeft">
          <div className="analysisImage">
            <div className="header">
              <div className="title">{displayMosaic.name}</div>
              <div className="warning">
                <ErrorOutlineOutlinedIcon fontSize="small" />
                {displayMosaic.imageURL
                  ? "Analysis Complete"
                  : "Needs Attention"}
              </div>
            </div>
            <div className="subtitle">{formatDate(displayMosaic.date)}</div>
            <div className="imageContainer">
              {displayMosaic.imageURL ? (
                <img
                  src={displayMosaic.imageURL}
                  alt={displayMosaic.name}
                  className="fieldImage"
                />
              ) : (
                <div className="noImagePlaceholder">No image available</div>
              )}
            </div>
          </div>
          <div className="zone">
            <div className="zoneTitle">Field Zones</div>
            {selectedMosaic ? (
              <div className="zoneMessage">
                Zone analysis data will be displayed here when available from
                the mosaic analysis.
              </div>
            ) : (
              <div className="zoneMessage">
                Upload a mosaic to see zone analysis data.
              </div>
            )}
          </div>
        </div>
        <div className="bottomRight">
          <div className="keyMetrics">
            <div className="title">Key Metrics</div>

            {analysisData ? (
              <div className="legacyMetrics">
                <div className="metricItem">
                  <div className="metricIcon">
                    <ErrorOutlineOutlinedIcon />
                  </div>
                  <div className="metricContent">
                    <div className="metricLabel">Vegetation (NDVI)</div>
                    <div className="metricValue">{analysisData.vegetation}</div>
                  </div>
                  <div className="metricStatus down">
                    <SouthOutlinedIcon fontSize="small" />
                    down
                  </div>
                </div>

                <div className="metricItem">
                  <div className="metricIcon">💧</div>
                  <div className="metricContent">
                    <div className="metricLabel">Water Stress</div>
                    <div className="metricValue">
                      {analysisData.waterStress}
                    </div>
                  </div>
                  <div className="metricStatus up">
                    <NorthOutlinedIcon fontSize="small" />
                    up
                  </div>
                </div>

                <div className="metricItem">
                  <div className="metricIcon">⚡</div>
                  <div className="metricContent">
                    <div className="metricLabel">Nitrogen Level</div>
                    <div className="metricValue">
                      {analysisData.nitrogenLevel}
                    </div>
                  </div>
                  <div className="metricStatus stable">
                    <EastOutlinedIcon fontSize="small" />
                    stable
                  </div>
                </div>
              </div>
            ) : (
              <div className="noAnalysisMessage">
                Upload and analyze a mosaic to see key metrics.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MosaicAnalysis;
