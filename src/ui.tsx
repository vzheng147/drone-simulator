import * as React from "react";
import Button from "@mui/material/Button";
import Banner from "./components/Banner";

export default function UI() {
  return (
    <>
      <Banner />
      <Button variant="contained">Hello world</Button>
    </>
  );
}
