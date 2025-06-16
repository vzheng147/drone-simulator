import { useState } from "react";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

import "./NavBar.css";

type NavItem = {
  name: string;
  date: Date;
  location: string;
  status: number;
};

type NavBarProps = {
  items: NavItem[];
};

function NavChoice(
  props: NavItem & { isSelected: boolean; onClick: () => void }
) {
  function formatDate(date: Date): string {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = String(date.getFullYear());
    return `${mm}/${dd}/${yyyy}`;
  }

  const getStatusIcon = () => {
    switch (props.status) {
      case 0:
        return <CheckCircleOutlineOutlinedIcon />;
      case 1:
        return <ErrorOutlineOutlinedIcon />;
      case 2:
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

function NavBar(props: NavBarProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  return (
    <div className="navbar">
      <div className="analyseText">Analyses</div>
      {props.items.map((item, index) => (
        <NavChoice
          key={`${item.name}-${index}`}
          {...item}
          isSelected={selectedItem === item.name}
          onClick={() => setSelectedItem(item.name)}
        />
      ))}
    </div>
  );
}

export default NavBar;
