import React from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Card, Button, Form } from "react-bootstrap";

export default function DataUpload({ onDataUpload }) {
  const handleFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: (result) => processData(result.data),
      });
    } else if (ext === "xlsx") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        processData(rows);
      };
      reader.readAsBinaryString(file);
    } else if (ext === "json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        processData(JSON.parse(e.target.result));
      };
      reader.readAsText(file);
    } else {
      alert("Unsupported file type!");
    }
  };

  const processData = (rows) => {
    if (!rows.length) return;

    const columns = Object.keys(rows[0]);
    let stats = {};

    columns.forEach((col) => {
      const values = rows.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v));
      if (values.length > 0) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const std = Math.sqrt(
          values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
        );
        stats[col] = { mean, min, max, std };
      }
    });

    onDataUpload(rows, stats);
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title className="text-primary">Upload Your Data</Card.Title>
        <Form.Group controlId="formFile" className="mb-3">
          <Form.Label>Select a file (CSV, XLSX, JSON)</Form.Label>
          <Form.Control type="file" onChange={handleFile} />
        </Form.Group>
        <Button variant="primary" disabled>
          Upload and Analyze
        </Button>
      </Card.Body>
    </Card>
  );
}
