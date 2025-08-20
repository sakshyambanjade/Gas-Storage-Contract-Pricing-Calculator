import React, { useState } from 'react';
import DataUpload from './components/DataUpload.js';
import MarketAnalysis from './components/MarketAnalysis';
import ParameterInput from './components/ParameterInput';
import ResultsDashboard from './components/ResultsDashboard';
import { Calculator, TrendingUp, Settings, BarChart3 } from 'lucide-react';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [priceData, setPriceData] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [contractParams, setContractParams] = useState({
    maxCapacity: 1000000,
    injectionRate: 50000,
    withdrawalRate: 75000,
    storageCost: 0.15,
    injectionCost: 0.05,
    withdrawalCost: 0.08,
    contractDuration: 12
  });
  const [pricingResults, setPricingResults] = useState(null);

  const steps = [
    { id: 1, title: 'Upload Data', icon: TrendingUp, component: DataUpload },
    { id: 2, title: 'Market Analysis', icon: BarChart3, component: MarketAnalysis },
    { id: 3, title: 'Parameters', icon: Settings, component: ParameterInput },
    { id: 4, title: 'Results', icon: Calculator, component: ResultsDashboard }
  ];

  const handleDataUpload = (data, analysis) => {
    setPriceData(data);
    setAnalysisData(analysis);
    setCurrentStep(2);
  };

  const handleAnalysisComplete = () => {
    setCurrentStep(3);
  };

  const handleParametersSet = (params) => {
    setContractParams(params);
    setCurrentStep(4);
  };

  const handleResultsGenerated = (results) => {
    setPricingResults(results);
  };

  const CurrentComponent = steps.find(step => step.id === currentStep)?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Gas Storage Contract Pricing Calculator
            </h1>
            <div className="text-sm text-gray-500">
              Production Validation Prototype
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <step.icon size={20} />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="ml-8 w-20 h-0.5 bg-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {CurrentComponent && (
          <CurrentComponent
            priceData={priceData}
            analysisData={analysisData}
            contractParams={contractParams}
            pricingResults={pricingResults}
            onDataUpload={handleDataUpload}
            onAnalysisComplete={handleAnalysisComplete}
            onParametersSet={handleParametersSet}
            onResultsGenerated={handleResultsGenerated}
          />
        )}
      </main>
    </div>
  );
}

export default App;