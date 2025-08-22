import React, { useState } from "react";
import axios from "axios";

export default function DataUpload({ onDataUpload }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);

  const handleFile = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    if (!file) return alert("Pick a file!");

    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post("http://localhost:5000/api/upload-data", formData);
    setPreview(res.data.data); // first rows
    onDataUpload(res.data.data, res.data.analysis); // pass to parent
  };

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h2 className="text-lg font-bold mb-2">Upload Gas Data</h2>
      <input type="file" onChange={handleFile} />
      <button onClick={uploadFile} className="ml-2 px-3 py-1 bg-blue-500 text-white rounded">
        Upload
      </button>

      {preview.length > 0 && (
        <table className="mt-4 border-collapse border border-gray-400">
          <thead>
            <tr>
              {Object.keys(preview[0]).map((col) => (
                <th key={col} className="border border-gray-400 px-2">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((val, j) => (
                  <td key={j} className="border border-gray-400 px-2">{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
