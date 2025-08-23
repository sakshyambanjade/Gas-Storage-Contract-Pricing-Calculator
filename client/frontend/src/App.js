import React, { useState } from "react";
import NavbarComp from "./components/NavbarComp";
import DataUpload from "./components/DataUpload";
import GasCharts from "./components/GasCharts";
import HelpPage from "./components/HelpPage";
import RiskPanel from "./components/RiskPanel";
import { Container, Row, Col, Card } from "react-bootstrap";

export default function App() {
  const [data, setData] = useState([]);
  const [analysis, setAnalysis] = useState({});
  const [page, setPage] = useState("upload"); // upload | charts | help

  const handleUpload = (rows, stats) => {
    setData(rows);
    setAnalysis(stats);
    setPage("charts");
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <NavbarComp setPage={setPage} />

      <Container className="flex-grow-1 py-4">
        {page === "upload" && <DataUpload onDataUpload={handleUpload} />}
        {page === "charts" && data.length > 0 && (
          <>
            {/* Charts */}
            <GasCharts data={data} />

            {/* Quick Stats */}
            <h3 className="mt-5 mb-3 text-primary">Quick Statistics</h3>
            <Row>
              {Object.entries(analysis).map(([col, stats]) => (
                <Col md={4} key={col} className="mb-4">
                  <Card className="shadow-sm">
                    <Card.Body>
                      <Card.Title className="text-primary">{col}</Card.Title>
                      <Card.Text>
                        Mean: {stats.mean.toFixed(2)} <br />
                        Min: {stats.min.toFixed(2)} <br />
                        Max: {stats.max.toFixed(2)} <br />
                        Std Dev: {stats.std.toFixed(2)}
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Risk Analysis */}
            <h3 className="mt-5 mb-3 text-danger">Risk Analysis</h3>
            <RiskPanel priceData={data} />  
          </>
        )}
        {page === "help" && <HelpPage />}
      </Container>

      <footer className="bg-white text-center py-3 border-top text-muted">
        © {new Date().getFullYear()} Gas Data Dashboard — $KB
      </footer>
    </div>
  );
}
