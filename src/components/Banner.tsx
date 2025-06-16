import { useState } from "react";
import Button from "@mui/material/Button";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SettingsIcon from "@mui/icons-material/Settings";
import "./Banner.css";

function Banner() {
  return (
    <div className="banner">
      <div className="logo">
        <ElectricBoltIcon className="lightningIcon" />
        <div>FieldVision</div>
      </div>

      <div className="right">
        <NotificationsNoneIcon />
        <SettingsIcon />
        <div className="user-section">
          <div className="user-avatar">V</div>
          <div className="username">Farmer Vincent</div>
        </div>
      </div>
    </div>
  );
}

export default Banner;
