// RiskPanel.js
import React, { useState } from "react";
import { Button, Card, Table } from "react-bootstrap";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function RiskPanel({ priceData }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const callApi = async () => {
    if (!priceData || priceData.length < 5) {
      alert("Please upload at least 5 price rows first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/volatility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceData, var_confidences: [0.01, 0.05, 0.10], rolling_window: 30 })
      });
      const json = await res.json();
      if (json.success) setAnalysis(json.analysis);
      else alert(json.error || "Error from server");
    } catch (err) {
      console.error(err);
      alert("Network error: couldn't reach backend");
    } finally {
      setLoading(false);
    }
  };

  if (!priceData) return null;

  return (
    <div className="mt-4">
      <Card className="mb-4">
        <Card.Body className="d-flex justify-content-between align-items-center">
          <div>
            <h5>Risk & Volatility</h5>
            <p className="mb-0 text-muted">Fit GARCH(1,1) / rolling vol and compute VaR & CVaR</p>
          </div>
          <div>
            <Button onClick={callApi} disabled={loading}>
              {loading ? "Computing..." : "Run Risk Analysis"}
            </Button>
          </div>
        </Card.Body>
      </Card>

      {analysis && (
        <>
          <Card className="mb-4">
            <Card.Body>
              <h6>Key Metrics</h6>
              <Table bordered size="sm">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Start Date</td><td>{analysis.start_date}</td></tr>
                  <tr><td>End Date</td><td>{analysis.end_date}</td></tr>
                  <tr><td>Rows</td><td>{analysis.rows}</td></tr>
                  <tr><td>Return Mean</td><td>{(analysis.return_stats.mean || 0).toFixed(6)}</td></tr>
                  <tr><td>Return Std</td><td>{(analysis.return_stats.std || 0).toFixed(6)}</td></tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Volatility chart (rolling) */}
          <Card className="mb-4">
            <Card.Body>
              <h6>Volatility (Rolling)</h6>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={analysis.rolling_vol}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="vol" stroke="#ff7300" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          {/* VaR table */}
          <Card className="mb-4">
            <Card.Body>
              <h6>Value at Risk (VaR) & CVaR (Expected Shortfall)</h6>
              <Table bordered size="sm">
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>Parametric VaR</th>
                    <th>Historical VaR</th>
                    <th>CVaR (ES)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analysis.var).map(([k, v]) => (
                    <tr key={k}>
                      <td>{k}</td>
                      <td>{(v.parametric_var || 0).toFixed(6)}</td>
                      <td>{(v.historical_var || 0).toFixed(6)}</td>
                      <td>{(v.cvar || 0).toFixed(6)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
}
