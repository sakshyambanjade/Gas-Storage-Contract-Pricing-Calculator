import React from "react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Card } from "react-bootstrap";

export default function GasCharts({ data }) {
  const columns = Object.keys(data[0]).filter((col) => col !== "date");

  return (
    <div>
      {columns.map((col) => (
        <Card key={col} className="mb-4 shadow-sm">
          <Card.Body>
            <Card.Title className="text-primary">{col}</Card.Title>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid stroke="#ccc" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={col} stroke="#007bff" />
              </LineChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
