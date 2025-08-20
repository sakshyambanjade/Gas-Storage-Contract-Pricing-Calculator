from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
from pricing_engine import PricingEngine
from data_analyzer import DataAnalyzer
import io
import base64
import matplotlib.pyplot as plt
import plotly.graph_objs as go
import plotly.utils

app = Flask(__name__)
CORS(app)

pricing_engine = PricingEngine()
data_analyzer = DataAnalyzer()

@app.route('/api/upload-data', methods=['POST'])
def upload_data():
    try:
        file = request.files['file']
        df = pd.read_csv(file)
        
        # Validate required columns
        required_columns = ['date', 'price']
        if not all(col in df.columns for col in required_columns):
            return jsonify({'error': 'CSV must contain date and price columns'}), 400
        
        # Convert date column
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Generate analysis charts
        analysis_data = data_analyzer.generate_market_analysis(df)
        
        return jsonify({
            'success': True,
            'data': df.to_dict('records'),
            'analysis': analysis_data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/calculate-contract', methods=['POST'])
def calculate_contract():
    try:
        data = request.json
        price_data = pd.DataFrame(data['priceData'])
        params = data['parameters']
        
        # Calculate contract pricing
        results = pricing_engine.price_storage_contract(price_data, params)
        
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scenario-analysis', methods=['POST'])
def scenario_analysis():
    try:
        data = request.json
        price_data = pd.DataFrame(data['priceData'])
        base_params = data['parameters']
        
        scenarios = pricing_engine.run_scenario_analysis(price_data, base_params)
        
        return jsonify(scenarios)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)