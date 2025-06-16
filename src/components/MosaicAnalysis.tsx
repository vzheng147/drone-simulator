import NorthOutlinedIcon from "@mui/icons-material/NorthOutlined";
import SouthOutlinedIcon from "@mui/icons-material/SouthOutlined";
import EastOutlinedIcon from "@mui/icons-material/EastOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import "./MosaicAnalysis.css";


function MosaicAnalysis() {
  return (
    <div className="layout">
      <div className="upper">
        <div>Mosaic Analysis</div>

        <button>
          <FileUploadOutlinedIcon />
          Upload Mosaic
        </button>
      </div>
      <div className="bottom">
        <div className="bottomLeft">
          <div className="analysisImage">
            <div className="header">
              <div className="title">South Farm Analysis</div>
              <div className="warning">
                <ErrorOutlineOutlinedIcon fontSize="small" />
                Needs Attention
              </div>
            </div>
            <div className="subtitle">7/15/2024, 5:30:00 AM</div>
            <div className="imageContainer">South Farm Mosaic</div>
          </div>
          <div className="zone">Field Zones</div>
        </div>
        <div className="bottomRight">
          <div className="keyMetrics">
            <div className="title">Key Metrics</div>

            <div className="metricItem">
              <div className="metricIcon">
                <ErrorOutlineOutlinedIcon />
              </div>
              <div className="metricContent">
                <div className="metricLabel">Vegetation (NDVI)</div>
                <div className="metricValue">0.68</div>
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
                <div className="metricValue">0.45</div>
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
                <div className="metricValue">0.55</div>
              </div>
              <div className="metricStatus stable">
                <EastOutlinedIcon fontSize="small" />
                stable
              </div>
            </div>
          </div>
          <div className="recommendations">AI Recommendations</div>
        </div>
      </div>
    </div>
  );
}

export default MosaicAnalysis;
