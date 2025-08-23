import React from "react";
import { Card } from "react-bootstrap";

export default function HelpPage() {
  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title className="text-primary">How to Use the Dashboard</Card.Title>
        <Card.Text>
          This dashboard is built for analyzing <b>gas price data</b> and
          related indicators. Upload your dataset and the system will generate
          charts & summary statistics automatically.
        </Card.Text>

        <h5 className="mt-4">Accepted File Types</h5>
        <ul>
          <li>CSV (.csv)</li>
          <li>Excel (.xlsx)</li>
          <li>JSON (.json)</li>
        </ul>

        <h5 className="mt-4">Supported Columns</h5>
        <ul>
          <li><b>date</b> — Date of measurement (required)</li>
          <li><b>price</b> — Gas spot price</li>
          <li><b>futuresprice</b> — Futures price</li>
          <li><b>volume</b> — Trading volume</li>
          <li><b>demand</b> — Gas demand</li>
          <li><b>supply</b> — Gas supply</li>
          <li><b>temperature</b> — IoT sensor temperature (°C)</li>
          <li><b>pressure</b> — Storage/transport pressure (bar)</li>
        </ul>

        <h5 className="mt-4">What You’ll See</h5>
        <ul>
          <li>Line charts for each available indicator</li>
          <li>Quick statistics (mean, min, max, std dev)</li>
          <li>Works even if some columns are missing</li>
        </ul>

        <h5 className="mt-4">Tip for Managers</h5>
        <Card.Text>
          Upload your supplier, market, or IoT data. The dashboard helps spot{" "}
          <b>trends</b>, check <b>volatility</b>, and analyze{" "}
          <b>demand vs supply</b> — without spreadsheets.
        </Card.Text>
      </Card.Body>
    </Card>
  );
}
