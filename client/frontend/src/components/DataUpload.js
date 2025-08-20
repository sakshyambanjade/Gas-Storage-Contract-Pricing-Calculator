import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertTriangle } from 'lucide-react';

const DataUpload = ({ onDataUpload, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = (file) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setError(null);
    
    // Read and validate CSV structure before uploading
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      
      if (lines.length < 2) {
        setError('CSV file must contain at least a header row and one data row');
        return;
      }
      
      const header = lines[0].toLowerCase().replace(/\r/g, '').split(',');
      const hasDateColumn = header.some(col => col.trim().includes('date'));
      const hasPriceColumn = header.some(col => col.trim().includes('price'));
      
      if (!hasDateColumn) {
        setError('CSV must contain a "date" column. Found columns: ' + lines[0]);
        return;
      }
      
      if (!hasPriceColumn) {
        setError('CSV must contain a "price" column. Found columns: ' + lines[0]);
        return;
      }
      
      // If validation passes, proceed with upload
      onDataUpload(file);
    };
    
    reader.onerror = () => {
      setError('Failed to read file');
    };
    
    reader.readAsText(file);
  };

  const downloadSample = () => {
    const sampleData = `Date,Price
2023-01-01,3.25
2023-01-02,3.18
2023-01-03,3.22
2023-01-04,3.35
2023-01-05,3.41
2023-01-06,3.38
2023-01-07,3.29
2023-01-08,3.15
2023-01-09,3.08
2023-01-10,3.12
2023-01-11,3.28
2023-01-12,3.33
2023-01-13,3.19
2023-01-14,3.24
2023-01-15,3.31
2023-01-16,3.17
2023-01-17,3.26
2023-01-18,3.39
2023-01-19,3.44
2023-01-20,3.36
2023-01-22,3.42
2023-01-23,3.29
2023-01-24,3.18
2023-01-25,3.33
2023-01-26,3.47
2023-01-27,3.52
2023-01-29,3.38
2023-01-30,3.25
2023-01-31,3.41
2023-02-01,3.29
2023-02-02,3.15
2023-02-03,3.22
2023-02-06,3.47
2023-02-07,3.61
2023-02-08,3.44
2023-02-09,3.28
2023-02-10,3.13
2023-02-13,3.36
2023-02-14,3.52
2023-02-15,3.19
2023-02-16,3.41
2023-02-17,3.27
2023-02-21,3.18
2023-02-22,3.44
2023-02-23,3.58
2023-02-24,3.32
2023-02-27,3.21
2023-02-28,3.49
2023-03-01,3.37
2023-03-02,3.14
2023-03-03,3.28
2023-03-06,3.51
2023-03-07,3.43
2023-03-08,3.19
2023-03-09,3.35
2023-03-10,3.62
2023-03-13,3.48
2023-03-14,3.22
2023-03-15,3.37
2023-03-16,3.55
2023-03-17,3.41
2023-03-20,3.18
2023-03-21,3.33
2023-03-22,3.59
2023-03-23,3.26
2023-03-24,3.14
2023-03-27,3.47
2023-03-28,3.61
2023-03-29,3.38
2023-03-30,3.25
2023-03-31,3.52
2023-04-03,3.39
2023-04-04,3.16
2023-04-05,3.28
2023-04-06,3.54
2023-04-07,3.42
2023-04-10,3.21
2023-04-11,3.37
2023-04-12,3.58
2023-04-13,3.31
2023-04-14,3.18
2023-04-17,3.45
2023-04-18,3.62
2023-04-19,3.29
2023-04-20,3.13
2023-04-21,3.41
2023-04-24,3.56
2023-04-25,3.34
2023-04-26,3.19
2023-04-27,3.47
2023-04-28,3.61
2023-05-01,3.28
2023-05-02,3.15
2023-05-03,3.39
2023-05-04,3.53
2023-05-05,3.41`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_gas_prices.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Upload Gas Price Data
        </h2>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center">
            <Upload
              className={`w-12 h-12 mb-4 ${
                isDragging ? 'text-blue-500' : 'text-gray-400'
              }`}
            />
            <div className="text-lg font-medium text-gray-900 mb-2">
              {isDragging ? 'Drop your file here' : 'Upload CSV file'}
            </div>
            <div className="text-sm text-gray-500 mb-4">
              Drag and drop or click to select a file
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Uploading...' : 'Select File'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Requirements */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Data Requirements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Required Columns:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code className="bg-gray-200 px-1 rounded">Date</code> or <code className="bg-gray-200 px-1 rounded">date</code> - Date in YYYY-MM-DD format</li>
                <li>• <code className="bg-gray-200 px-1 rounded">Price</code> or <code className="bg-gray-200 px-1 rounded">price</code> - Gas price ($/MMBtu)</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                Column names are case-insensitive. Example: "Date,Price" or "date,price"
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">File Format:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• CSV format with header row</li>
                <li>• UTF-8 encoding recommended</li>
                <li>• Daily price data preferred</li>
                <li>• Minimum 90 days of data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sample Data */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Need sample data?
            </h3>
            <p className="text-sm text-gray-600">
              Download a sample CSV file to see the required format
            </p>
          </div>
          <button
            onClick={downloadSample}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Sample
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataUpload;