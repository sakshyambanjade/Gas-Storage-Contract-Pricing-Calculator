import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function GasCharts({ data }) {
  if (!data || data.length === 0) return <p>No data uploaded yet</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Gas Price Trend</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {data[0].price && <Line type="monotone" dataKey="price" stroke="#8884d8" />}
          {data[0].futuresprice && <Line type="monotone" dataKey="futuresprice" stroke="#82ca9d" />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
