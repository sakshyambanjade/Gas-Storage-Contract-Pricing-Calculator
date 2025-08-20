import React, { useState } from 'react';
import { Settings, Calculator, Info, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ParameterInput = ({ contractParams, priceData, onParametersSet, onResultsGenerated }) => {
  const [params, setParams] = useState(contractParams);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    const numericValue = parseFloat(value) || 0;
    setParams(prev => ({ ...prev, [field]: numericValue }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateParams = () => {
    const newErrors = {};
    
    if (params.maxCapacity <= 0) {
      newErrors.maxCapacity = 'Capacity must be greater than 0';
    }
    
    if (params.injectionRate <= 0) {
      newErrors.injectionRate = 'Injection rate must be greater than 0';
    }
    
    if (params.withdrawalRate <= 0) {
      newErrors.withdrawalRate = 'Withdrawal rate must be greater than 0';
    }
    
    if (params.injectionRate > params.maxCapacity) {
      newErrors.injectionRate = 'Injection rate cannot exceed max capacity';
    }
    
    if (params.withdrawalRate > params.maxCapacity) {
      newErrors.withdrawalRate = 'Withdrawal rate cannot exceed max capacity';
    }
    
    if (params.contractDuration <= 0 || params.contractDuration > 60) {
      newErrors.contractDuration = 'Duration must be between 1 and 60 months';
    }

    if (params.storageCost < 0 || params.storageCost > 5) {
      newErrors.storageCost = 'Storage cost must be between 0 and 5 $/MMBtu/year';
    }

    if (params.injectionCost < 0 || params.injectionCost > 2) {
      newErrors.injectionCost = 'Injection cost must be between 0 and 2 $/MMBtu';
    }

    if (params.withdrawalCost < 0 || params.withdrawalCost > 2) {
      newErrors.withdrawalCost = 'Withdrawal cost must be between 0 and 2 $/MMBtu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = async () => {
    if (!validateParams()) {
      return;
    }

    setIsCalculating(true);
    
    try {
      const response = await axios.post('/api/calculate-contract', {
        priceData: priceData,
        parameters: params
      });

      onParametersSet(params);
      onResultsGenerated(response.data);
    } catch (error) {
      console.error('Calculation failed:', error);
      setErrors({ general: error.response?.data?.error || 'Calculation failed. Please try again.' });
    } finally {
      setIsCalculating(false);
    }
  };

  const parameterSections = [
    {
      title: 'Storage Capacity',
      icon: <Settings className="w-5 h-5 text-blue-500" />,
      parameters: [
        {
          key: 'maxCapacity',
          label: 'Maximum Capacity',
          value: params.maxCapacity,
          unit: 'MMBtu',
          description: 'Total storage capacity available for the contract',
          min: 1000,
          max: 10000000,
          step: 1000
        },
        {
          key: 'injectionRate',
          label: 'Daily Injection Rate',
          value: params.injectionRate,
          unit: 'MMBtu/day',
          description: 'Maximum daily rate for injecting gas into storage',
          min: 1000,
          max: 1000000,
          step: 1000
        },
        {
          key: 'withdrawalRate',
          label: 'Daily Withdrawal Rate',
          value: params.withdrawalRate,
          unit: 'MMBtu/day',
          description: 'Maximum daily rate for withdrawing gas from storage',
          min: 1000,
          max: 1000000,
          step: 1000
        }
      ]
    },
    {
      title: 'Cost Structure',
      icon: <Calculator className="w-5 h-5 text-green-500" />,
      parameters: [
        {
          key: 'storageCost',
          label: 'Storage Cost',
          value: params.storageCost,
          unit: '$/MMBtu/year',
          description: 'Annual cost for storing gas (reservation fee)',
          min: 0.01,
          max: 2.0,
          step: 0.01
        },
        {
          key: 'injectionCost',
          label: 'Injection Cost',
          value: params.injectionCost,
          unit: '$/MMBtu',
          description: 'Variable cost for each MMBtu injected',
          min: 0.01,
          max: 1.0,
          step: 0.01
        },
        {
          key: 'withdrawalCost',
          label: 'Withdrawal Cost',
          value: params.withdrawalCost,
          unit: '$/MMBtu',
          description: 'Variable cost for each MMBtu withdrawn',
          min: 0.01,
          max: 1.0,
          step: 0.01
        }
      ]
    },
    {
      title: 'Contract Terms',
      icon: <Info className="w-5 h-5 text-purple-500" />,
      parameters: [
        {
          key: 'contractDuration',
          label: 'Contract Duration',
          value: params.contractDuration,
          unit: 'months',
          description: 'Length of the storage contract',
          min: 1,
          max: 60,
          step: 1
        }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Contract Parameters
          </h2>
          <div className="text-sm text-gray-500">
            Configure storage contract terms and costs
          </div>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{errors.general}</span>
            </div>
          </div>
        )}

        {/* Parameter Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {parameterSections.map((section) => (
            <div key={section.title} className="border rounded-lg p-6">
              <div className="flex items-center mb-4">
                {section.icon}
                <h3 className="text-lg font-semibold text-gray-900 ml-2">
                  {section.title}
                </h3>
              </div>

              <div className="space-y-4">
                {section.parameters.map((param) => (
                  <div key={param.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {param.label}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={param.value}
                        onChange={(e) => handleInputChange(param.key, e.target.value)}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors[param.key] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-sm">{param.unit}</span>
                      </div>
                    </div>
                    {errors[param.key] && (
                      <p className="mt-1 text-sm text-red-600">{errors[param.key]}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">{param.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Key Ratios and Insights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-600">Injection Ratio</div>
            <div className="text-2xl font-bold text-blue-900">
              {((params.injectionRate / params.maxCapacity) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-blue-600">of capacity per day</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm font-medium text-green-600">Withdrawal Ratio</div>
            <div className="text-2xl font-bold text-green-900">
              {((params.withdrawalRate / params.maxCapacity) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-green-600">of capacity per day</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm font-medium text-purple-600">Fill Time</div>
            <div className="text-2xl font-bold text-purple-900">
              {Math.ceil(params.maxCapacity / params.injectionRate)}
            </div>
            <div className="text-xs text-purple-600">days to fill</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm font-medium text-orange-600">Empty Time</div>
            <div className="text-2xl font-bold text-orange-900">
              {Math.ceil(params.maxCapacity / params.withdrawalRate)}
            </div>
            <div className="text-xs text-orange-600">days to empty</div>
          </div>
        </div>

        {/* Calculate Button */}
        <div className="flex justify-center">
          <button
            onClick={handleCalculate}
            disabled={isCalculating || Object.keys(errors).length > 0}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-lg font-semibold transition-colors"
          >
            <Calculator className="w-5 h-5 mr-2" />
            {isCalculating ? 'Calculating...' : 'Calculate Contract Value'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParameterInput;