import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { useMosaicContext, type Mosaic } from "../context/MosaicContext";

import "./NavBar.css";

function NavChoice(
  props: Mosaic & { isSelected: boolean; onClick: () => void }
) {
  function formatDate(date: Date): string {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = String(date.getFullYear());
    return `${mm}/${dd}/${yyyy}`;
  }

  // For now, we'll determine status based on whether imageURL exists
  // You can modify this logic later
  const getStatusIcon = () => {
    const status = props.imageURL ? 0 : 1; // 0 if has image, 1 if no image

    switch (status) {
      case 0:
        return <CheckCircleOutlineOutlinedIcon />;
      case 1:
        return <ErrorOutlineOutlinedIcon />;
      case 0:
        return <CancelOutlinedIcon />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`navItem ${props.isSelected ? "selected" : ""}`}
      onClick={props.onClick}
    >
      <div className="itemLeft">
        <div className="name">{props.name}</div>
        <div className="locationDate">
          {formatDate(props.date)} - {props.location}
        </div>
      </div>
      {getStatusIcon()}
    </div>
  );
}

function NavBar() {
  const { user, selectedMosaic, setSelectedMosaic } = useMosaicContext();

  // If no user is logged in, show empty state
  if (!user) {
    return (
      <div className="navbar">
        <div className="analyseText">Analyses</div>
        <div className="emptyState">Please log in to view analyses</div>
      </div>
    );
  }

  return (
    <div className="navbar">
      <div className="analyseText">Analyses</div>
      {user.mosaics.map((mosaic, index) => (
        <NavChoice
          key={`${mosaic.name}-${index}`}
          {...mosaic}
          isSelected={selectedMosaic?.name === mosaic.name}
          onClick={() => setSelectedMosaic(mosaic)}
        />
      ))}
    </div>
  );
}

export default NavBar;
