import React, { useState } from "react";
import DataUpload from "./components/DataUpload";
import GasCharts from "./components/GasCharts";

function App() {
  const [data, setData] = useState([]);
  const [analysis, setAnalysis] = useState({});

  const handleUpload = (d, a) => {
    setData(d);
    setAnalysis(a);
  };

  return (
    <div className="p-6">
      <DataUpload onDataUpload={handleUpload} />
      <GasCharts data={data} />
    </div>
  );
}

export default App;
