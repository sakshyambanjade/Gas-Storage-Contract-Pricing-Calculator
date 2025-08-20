import pandas as pd
import numpy as np
from datetime import datetime
import matplotlib.pyplot as plt
import plotly.graph_objs as go
import plotly.utils
from scipy import stats

class DataAnalyzer:
    def __init__(self):
        pass
    
    def generate_market_analysis(self, df):
        """
        Generate comprehensive market analysis charts
        """
        analysis = {}
        
        # Price history with trend
        analysis['priceHistory'] = self._create_price_history_chart(df)
        
        # Price distribution
        analysis['priceDistribution'] = self._create_price_distribution_chart(df)
        
        # Seasonal patterns
        analysis['seasonalPatterns'] = self._create_seasonal_pattern_chart(df)
        
        # Volatility analysis
        analysis['volatilityAnalysis'] = self._create_volatility_chart(df)
        
        # Moving averages
        analysis['movingAverages'] = self._create_moving_averages_chart(df)
        
        # Price percentiles
        analysis['pricePercentiles'] = self._create_price_percentiles_chart(df)
        
        return analysis
    
    def _create_price_history_chart(self, df):
        """
        Create price history chart with trend line
        """
        df_sorted = df.sort_values('date')
        
        # Calculate trend line
        x = np.arange(len(df_sorted))
        y = df_sorted['price'].values
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
        trend_line = slope * x + intercept
        
        chart_data = []
        for i, (_, row) in enumerate(df_sorted.iterrows()):
            chart_data.append({
                'date': row['date'].strftime('%Y-%m-%d'),
                'price': row['price'],
                'trend': trend_line[i]
            })
        
        return chart_data
    
    def _create_price_distribution_chart(self, df):
        """
        Create price distribution histogram
        """
        prices = df['price'].values
        hist, bin_edges = np.histogram(prices, bins=20)
        
        distribution_data = []
        for i in range(len(hist)):
            bin_center = (bin_edges[i] + bin_edges[i+1]) / 2
            distribution_data.append({
                'price_range': f"{bin_edges[i]:.2f}-{bin_edges[i+1]:.2f}",
                'frequency': int(hist[i]),
                'bin_center': bin_center
            })
        
        stats_data = {
            'mean': float(prices.mean()),
            'median': float(np.median(prices)),
            'std': float(prices.std()),
            'min': float(prices.min()),
            'max': float(prices.max())
        }
        
        return {
            'distribution': distribution_data,
            'statistics': stats_data
        }
    
    def _create_seasonal_pattern_chart(self, df):
        """
        Create seasonal pattern analysis
        """
        df['month'] = pd.to_datetime(df['date']).dt.month
        df['quarter'] = pd.to_datetime(df['date']).dt.quarter
        
        monthly_stats = df.groupby('month')['price'].agg(['mean', 'std', 'min', 'max']).reset_index()
        quarterly_stats = df.groupby('quarter')['price'].agg(['mean', 'std', 'min', 'max']).reset_index()
        
        monthly_data = []
        for _, row in monthly_stats.iterrows():
            monthly_data.append({
                'month': int(row['month']),
                'avgPrice': float(row['mean']),
                'volatility': float(row['std']),
                'minPrice': float(row['min']),
                'maxPrice': float(row['max'])
            })
        
        quarterly_data = []
        for _, row in quarterly_stats.iterrows():
            quarterly_data.append({
                'quarter': f"Q{int(row['quarter'])}",
                'avgPrice': float(row['mean']),
                'volatility': float(row['std']),
                'minPrice': float(row['min']),
                'maxPrice': float(row['max'])
            })
        
        return {
            'monthly': monthly_data,
            'quarterly': quarterly_data
        }
    
    def _create_volatility_chart(self, df):
        """
        Create rolling volatility chart
        """
        df_sorted = df.sort_values('date')
        df_sorted['returns'] = df_sorted['price'].pct_change()
        
        # Calculate rolling volatility (30-day window)
        df_sorted['rolling_vol'] = df_sorted['returns'].rolling(window=30).std() * np.sqrt(252)  # Annualized
        
        volatility_data = []
        for _, row in df_sorted.iterrows():
            if not pd.isna(row['rolling_vol']):
                volatility_data.append({
                    'date': row['date'].strftime('%Y-%m-%d'),
                    'price': row['price'],
                    'volatility': float(row['rolling_vol'])
                })
        
        return volatility_data
    
    def _create_moving_averages_chart(self, df):
        """
        Create moving averages chart
        """
        df_sorted = df.sort_values('date')
        
        df_sorted['ma_30'] = df_sorted['price'].rolling(window=30).mean()
        df_sorted['ma_60'] = df_sorted['price'].rolling(window=60).mean()
        df_sorted['ma_90'] = df_sorted['price'].rolling(window=90).mean()
        
        ma_data = []
        for _, row in df_sorted.iterrows():
            ma_data.append({
                'date': row['date'].strftime('%Y-%m-%d'),
                'price': row['price'],
                'ma30': row['ma_30'] if not pd.isna(row['ma_30']) else None,
                'ma60': row['ma_60'] if not pd.isna(row['ma_60']) else None,
                'ma90': row['ma_90'] if not pd.isna(row['ma_90']) else None
            })
        
        return ma_data
    
    def _create_price_percentiles_chart(self, df):
        """
        Create price percentiles chart
        """
        percentiles = [10, 25, 50, 75, 90]
        price_percentiles = {}
        
        for p in percentiles:
            price_percentiles[f'P{p}'] = float(df['price'].quantile(p/100))
        
        # Create time series with percentile bands
        df_sorted = df.sort_values('date')
        percentile_data = []
        
        for _, row in df_sorted.iterrows():
            percentile_data.append({
                'date': row['date'].strftime('%Y-%m-%d'),
                'price': row['price'],
                **{f'p{p}': price_percentiles[f'P{p}'] for p in percentiles}
            })
        
        return {
            'data': percentile_data,
            'percentiles': price_percentiles
        }