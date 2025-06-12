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
        <ElectricBoltIcon fontSize="inherit" className="lightningIcon" />
        <div>FieldVision</div>
      </div>

      <div className="right">
        <NotificationsNoneIcon sx={{ "font-size": "3rem" }} />
        <SettingsIcon sx={{ "font-size": "3rem" }} />
        <div className="username">Farmer Vincent</div>
      </div>
    </div>
  );
}

export default Banner;
