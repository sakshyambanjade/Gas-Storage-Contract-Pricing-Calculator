import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";

export default function NavbarComp({ setPage }) {
  return (
    <Navbar bg="white" expand="lg" className="shadow-sm sticky-top">
      <Container>
        <Navbar.Brand
          href="#"
          className="fw-bold text-primary"
          onClick={() => setPage("upload")}
        >
          GasData.io
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="nav" />
        <Navbar.Collapse id="nav">
          <Nav className="ms-auto">
            <Nav.Link onClick={() => setPage("upload")}>Upload</Nav.Link>
            <Nav.Link onClick={() => setPage("charts")}>Charts</Nav.Link>
            <Nav.Link onClick={() => setPage("help")}>Help</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
