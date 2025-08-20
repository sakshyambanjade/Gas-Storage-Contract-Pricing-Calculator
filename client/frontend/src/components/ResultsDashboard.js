import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ComposedChart } from 'recharts';
import { TrendingUp, DollarSign, Activity, Download, AlertTriangle, CheckCircle, BarChart3, PieChart } from 'lucide-react';
import axios from 'axios';

const ResultsDashboard = ({ priceData, contractParams, pricingResults }) => {
  const [scenarioResults, setScenarioResults] = useState(null);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);

  useEffect(() => {
    if (pricingResults && priceData.length > 0) {
      loadScenarioAnalysis();
    }
  }, [pricingResults]);

  const loadScenarioAnalysis = async () => {
    setIsLoadingScenarios(true);
    try {
      const response = await axios.post('/api/scenario-analysis', {
        priceData: priceData,
        parameters: contractParams
      });
      setScenarioResults(response.data);
    } catch (error) {
      console.error('Failed to load scenario analysis:', error);
    } finally {
      setIsLoadingScenarios(false);
    }
  };

  if (!pricingResults) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Results Available
          </h2>
          <p className="text-gray-600">
            Please complete the previous steps to generate contract pricing results.
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const exportResults = () => {
    const exportData = {
      contractParams,
      pricingResults,
      scenarioResults,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gas-storage-analysis-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getProfitabilityStatus = () => {
    const npv = pricingResults.npv || 0;
    if (npv > 0) {
      return { status: 'Profitable', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
    } else {
      return { status: 'Loss-making', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle };
    }
  };

  const profitStatus = getProfitabilityStatus();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Contract Valuation Results
            </h2>
            <p className="text-gray-600 mt-2">
              Comprehensive analysis of your gas storage contract
            </p>
          </div>
          <button
            onClick={exportResults}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Analysis
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`${profitStatus.bg} rounded-lg p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contract NPV</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(pricingResults.npv)}
                </p>
              </div>
              <profitStatus.icon className={`w-8 h-8 ${profitStatus.color}`} />
            </div>
            <div className={`mt-2 text-sm ${profitStatus.color} font-medium`}>
              {profitStatus.status}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(pricingResults.totalRevenue)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-2 text-sm text-blue-600 font-medium">
              Gross earnings
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Costs</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(pricingResults.totalCosts)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-red-600" />
            </div>
            <div className="mt-2 text-sm text-red-600 font-medium">
              All-in costs
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilization</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(pricingResults.avgUtilization || 0, 1)}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
            <div className="mt-2 text-sm text-purple-600 font-medium">
              Storage efficiency
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Analysis */}
      {pricingResults.cashFlows && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-6">
            <BarChart3 className="w-6 h-6 text-blue-500 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">
              Monthly Cash Flow Analysis
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={pricingResults.cashFlows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" orientation="left" tickFormatter={formatCurrency} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Storage Level') {
                    return [formatNumber(value) + ' MMBtu', name];
                  }
                  return [formatCurrency(value), name];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Revenue" />
              <Bar yAxisId="left" dataKey="costs" fill="#ef4444" name="Costs" />
              <Line yAxisId="right" type="monotone" dataKey="storageLevel" stroke="#3b82f6" strokeWidth={3} name="Storage Level" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Storage Operations Timeline */}
      {pricingResults.operations && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-6">
            <Activity className="w-6 h-6 text-green-500 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">
              Storage Operations Timeline
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={pricingResults.operations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [formatNumber(value) + ' MMBtu', name]}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="injection" 
                stackId="1" 
                stroke="#10b981" 
                fill="#10b981" 
                name="Daily Injection"
              />
              <Area 
                type="monotone" 
                dataKey="withdrawal" 
                stackId="2" 
                stroke="#ef4444" 
                fill="#ef4444" 
                name="Daily Withdrawal"
              />
              <Line 
                type="monotone" 
                dataKey="storageLevel" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                name="Storage Level"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Scenario Analysis */}
      {scenarioResults && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-6">
            <PieChart className="w-6 h-6 text-purple-500 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">
              Scenario Analysis
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Capacity Scenarios */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Capacity Utilization Impact
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scenarioResults.capacityScenarios}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="scenario" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={[formatCurrency, 'NPV']} />
                  <Bar dataKey="npv" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Rate Scenarios */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Rate Sensitivity Analysis
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scenarioResults.rateScenarios}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="scenario" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={[formatCurrency, 'NPV']} />
                  <Legend />
                  <Line type="monotone" dataKey="injectionNPV" stroke="#10b981" name="Injection Rate" />
                  <Line type="monotone" dataKey="withdrawalNPV" stroke="#ef4444" name="Withdrawal Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Risk Metrics */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <AlertTriangle className="w-6 h-6 text-orange-500 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">
              Risk Assessment
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Price Volatility Risk</span>
              <span className="text-lg font-bold text-orange-600">
                {formatNumber((pricingResults.volatilityRisk || 0) * 100, 1)}%
              </span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Capacity Utilization Risk</span>
              <span className="text-lg font-bold text-blue-600">
                {formatNumber((pricingResults.utilizationRisk || 0) * 100, 1)}%
              </span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Operational Risk</span>
              <span className="text-lg font-bold text-purple-600">
                {formatNumber((pricingResults.operationalRisk || 0) * 100, 1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Contract Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">
              Contract Summary
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Max Capacity</span>
                <span className="font-medium">{formatNumber(contractParams.maxCapacity)} MMBtu</span>
              </div>
            </div>
            
            <div className="border-b border-gray-200 pb-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Contract Duration</span>
                <span className="font-medium">{contractParams.contractDuration} months</span>
              </div>
            </div>
            
            <div className="border-b border-gray-200 pb-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Storage Cost</span>
                <span className="font-medium">{formatCurrency(pricingResults.totalStorageCost)}</span>
              </div>
            </div>
            
            <div className="border-b border-gray-200 pb-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Cycles</span>
                <span className="font-medium">{formatNumber(pricingResults.expectedCycles || 0, 1)}</span>
              </div>
            </div>
            
            <div className="pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Net Present Value</span>
                <span className={pricingResults.npv >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(pricingResults.npv)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Recommendations */}
      {pricingResults.recommendations && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 text-blue-500 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">
              Trading Recommendations
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Optimal Strategy</h4>
              <ul className="space-y-2 text-gray-700">
                {pricingResults.recommendations.strategy.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Risk Considerations</h4>
              <ul className="space-y-2 text-gray-700">
                {pricingResults.recommendations.risks.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsDashboard;