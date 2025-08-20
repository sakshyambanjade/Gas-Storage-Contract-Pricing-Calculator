import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { TrendingUp, BarChart3, Activity, PieChart, ArrowRight } from 'lucide-react';

const MarketAnalysis = ({ priceData, analysisData, onAnalysisComplete }) => {
  if (!analysisData) return null;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Market Analysis Dashboard
          </h2>
          <button
            onClick={onAnalysisComplete}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            Continue to Parameters
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>

        {/* Summary Stats */}
        {analysisData.priceDistribution && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {Object.entries(analysisData.priceDistribution.statistics).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  {key}
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(value)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Price History Chart */}
          {analysisData.priceHistory && (
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Price History & Trend
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analysisData.priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickFormatter={formatPrice} />
                  <Tooltip 
                    labelFormatter={formatDate}
                    formatter={[formatPrice, 'Price']}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} name="Price" />
                  <Line type="monotone" dataKey="trend" stroke="#dc2626" strokeDasharray="5 5" name="Trend" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Price Distribution */}
          {analysisData.priceDistribution && (
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 text-green-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Price Distribution
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analysisData.priceDistribution.distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="price_range" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="frequency" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Moving Averages */}
          {analysisData.movingAverages && (
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Activity className="w-5 h-5 text-purple-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Moving Averages
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analysisData.movingAverages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickFormatter={formatPrice} />
                  <Tooltip 
                    labelFormatter={formatDate}
                    formatter={(value, name) => [value ? formatPrice(value) : 'N/A', name]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="price" stroke="#6b7280" strokeWidth={1} name="Price" />
                  <Line type="monotone" dataKey="ma30" stroke="#3b82f6" strokeWidth={2} name="30-Day MA" />
                  <Line type="monotone" dataKey="ma60" stroke="#8b5cf6" strokeWidth={2} name="60-Day MA" />
                  <Line type="monotone" dataKey="ma90" stroke="#ef4444" strokeWidth={2} name="90-Day MA" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Volatility Analysis */}
          {analysisData.volatilityAnalysis && (
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center mb-4">
                <PieChart className="w-5 h-5 text-orange-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Price Volatility (30-Day Rolling)
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analysisData.volatilityAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={formatDate}
                    formatter={[(value) => `${(value * 100).toFixed(1)}%`, 'Volatility']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="volatility" 
                    stroke="#f97316" 
                    fill="#fed7aa" 
                    name="Volatility"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Seasonal Analysis */}
        {analysisData.seasonalPatterns && (
          <div className="mt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Seasonal Patterns
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Patterns */}
              <div className="bg-white border rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Monthly Average Prices
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analysisData.seasonalPatterns.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={formatPrice} />
                    <Tooltip formatter={[formatPrice, 'Avg Price']} />
                    <Bar dataKey="avgPrice" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Quarterly Patterns */}
              <div className="bg-white border rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Quarterly Price Ranges
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analysisData.seasonalPatterns.quarterly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis tickFormatter={formatPrice} />
                    <Tooltip formatter={(value, name) => [formatPrice(value), name]} />
                    <Bar dataKey="minPrice" fill="#dc2626" name="Min Price" />
                    <Bar dataKey="avgPrice" fill="#3b82f6" name="Avg Price" />
                    <Bar dataKey="maxPrice" fill="#059669" name="Max Price" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketAnalysis;