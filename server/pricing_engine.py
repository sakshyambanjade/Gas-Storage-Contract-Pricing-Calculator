import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import plotly.graph_objs as go
import plotly.utils

class PricingEngine:
    def __init__(self):
        pass
    
    def price_storage_contract(self, price_data, params):
        """
        Core pricing function for gas storage contracts
        """
        df = price_data.copy()
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Extract parameters
        max_capacity = params['maxCapacity']
        injection_rate = params['injectionRate']
        withdrawal_rate = params['withdrawalRate']
        storage_cost = params['storageCost']
        injection_cost = params['injectionCost']
        withdrawal_cost = params['withdrawalCost']
        contract_duration = params['contractDuration']
        
        # Calculate optimal storage strategy
        strategy = self._calculate_optimal_strategy(df, params)
        
        # Calculate cash flows
        cash_flows = self._calculate_cash_flows(df, strategy, params)
        
        # Calculate NPV and metrics
        npv = self._calculate_npv(cash_flows)
        metrics = self._calculate_metrics(cash_flows, params)
        
        # Generate result charts
        charts = self._generate_result_charts(df, strategy, cash_flows)
        
        return {
            'npv': npv,
            'metrics': metrics,
            'strategy': strategy,
            'cashFlows': cash_flows,
            'charts': charts
        }
    
    def _calculate_optimal_strategy(self, df, params):
        """
        Calculate optimal injection/withdrawal strategy
        """
        strategy = []
        current_inventory = 0
        
        # Simple strategy: inject when prices are low, withdraw when high
        price_percentiles = df['price'].quantile([0.25, 0.75])
        low_threshold = price_percentiles[0.25]
        high_threshold = price_percentiles[0.75]
        
        for _, row in df.iterrows():
            price = row['price']
            date = row['date']
            
            action = 'hold'
            volume = 0
            
            if price <= low_threshold and current_inventory < params['maxCapacity']:
                # Inject
                max_inject = min(params['injectionRate'], params['maxCapacity'] - current_inventory)
                volume = max_inject
                action = 'inject'
                current_inventory += volume
                
            elif price >= high_threshold and current_inventory > 0:
                # Withdraw
                max_withdraw = min(params['withdrawalRate'], current_inventory)
                volume = max_withdraw
                action = 'withdraw'
                current_inventory -= volume
            
            strategy.append({
                'date': date.strftime('%Y-%m-%d'),
                'price': price,
                'action': action,
                'volume': volume,
                'inventory': current_inventory
            })
        
        return strategy
    
    def _calculate_cash_flows(self, df, strategy, params):
        """
        Calculate detailed cash flows
        """
        cash_flows = []
        
        for item in strategy:
            date = item['date']
            action = item['action']
            volume = item['volume']
            price = item['price']
            
            cash_flow = 0
            cost = 0
            
            if action == 'inject':
                cash_flow = -volume * price  # Pay for gas
                cost = volume * params['injectionCost']  # Injection costs
                
            elif action == 'withdraw':
                cash_flow = volume * price  # Receive payment for gas
                cost = volume * params['withdrawalCost']  # Withdrawal costs
            
            # Storage costs (daily)
            storage_cost = item['inventory'] * params['storageCost'] / 365
            
            net_cash_flow = cash_flow - cost - storage_cost
            
            cash_flows.append({
                'date': date,
                'action': action,
                'volume': volume,
                'price': price,
                'grossCashFlow': cash_flow,
                'operatingCost': cost,
                'storageCost': storage_cost,
                'netCashFlow': net_cash_flow,
                'inventory': item['inventory']
            })
        
        return cash_flows
    
    def _calculate_npv(self, cash_flows, discount_rate=0.05):
        """
        Calculate Net Present Value
        """
        npv = 0
        start_date = pd.to_datetime(cash_flows[0]['date'])
        
        for cf in cash_flows:
            date = pd.to_datetime(cf['date'])
            days_from_start = (date - start_date).days
            discount_factor = (1 + discount_rate) ** (-days_from_start / 365)
            npv += cf['netCashFlow'] * discount_factor
        
        return npv
    
    def _calculate_metrics(self, cash_flows, params):
        """
        Calculate key performance metrics
        """
        total_revenue = sum(cf['grossCashFlow'] for cf in cash_flows if cf['grossCashFlow'] > 0)
        total_costs = sum(abs(cf['grossCashFlow']) for cf in cash_flows if cf['grossCashFlow'] < 0)
        total_operating_costs = sum(cf['operatingCost'] for cf in cash_flows)
        total_storage_costs = sum(cf['storageCost'] for cf in cash_flows)
        
        total_injected = sum(cf['volume'] for cf in cash_flows if cf['action'] == 'inject')
        total_withdrawn = sum(cf['volume'] for cf in cash_flows if cf['action'] == 'withdraw')
        
        capacity_utilization = max(cf['inventory'] for cf in cash_flows) / params['maxCapacity']
        
        return {
            'totalRevenue': total_revenue,
            'totalCosts': total_costs,
            'totalOperatingCosts': total_operating_costs,
            'totalStorageCosts': total_storage_costs,
            'totalInjected': total_injected,
            'totalWithdrawn': total_withdrawn,
            'capacityUtilization': capacity_utilization,
            'grossProfit': total_revenue - total_costs,
            'netProfit': sum(cf['netCashFlow'] for cf in cash_flows)
        }
    
    def _generate_result_charts(self, df, strategy, cash_flows):
        """
        Generate charts for results visualization
        """
        # Convert strategy to DataFrame for easier manipulation
        strategy_df = pd.DataFrame(strategy)
        strategy_df['date'] = pd.to_datetime(strategy_df['date'])
        
        charts = {}
        
        # Inventory management timeline
        inventory_data = [
            {'date': item['date'], 'inventory': item['inventory']} 
            for item in strategy
        ]
        charts['inventoryTimeline'] = inventory_data
        
        # Cash flow waterfall
        cf_df = pd.DataFrame(cash_flows)
        monthly_cf = cf_df.groupby(pd.to_datetime(cf_df['date']).dt.to_period('M')).agg({
            'grossCashFlow': 'sum',
            'operatingCost': 'sum',
            'storageCost': 'sum',
            'netCashFlow': 'sum'
        }).reset_index()
        monthly_cf['date'] = monthly_cf['date'].astype(str)
        
        charts['cashFlowWaterfall'] = monthly_cf.to_dict('records')
        
        # Action summary
        action_summary = strategy_df.groupby('action').agg({
            'volume': 'sum',
            'price': 'mean'
        }).reset_index()
        charts['actionSummary'] = action_summary.to_dict('records')
        
        return charts
    
    def run_scenario_analysis(self, price_data, base_params):
        """
        Run multiple scenarios with different parameters
        """
        scenarios = {}
        
        # Base case
        base_result = self.price_storage_contract(price_data, base_params)
        scenarios['base'] = {'params': base_params, 'npv': base_result['npv']}
        
        # Capacity scenarios
        for multiplier in [0.5, 0.75, 1.25, 1.5]:
            params = base_params.copy()
            params['maxCapacity'] = int(base_params['maxCapacity'] * multiplier)
            result = self.price_storage_contract(price_data, params)
            scenarios[f'capacity_{multiplier}'] = {'params': params, 'npv': result['npv']}
        
        # Rate scenarios
        for multiplier in [0.5, 0.75, 1.25, 1.5]:
            params = base_params.copy()
            params['injectionRate'] = int(base_params['injectionRate'] * multiplier)
            params['withdrawalRate'] = int(base_params['withdrawalRate'] * multiplier)
            result = self.price_storage_contract(price_data, params)
            scenarios[f'rates_{multiplier}'] = {'params': params, 'npv': result['npv']}
        
        return scenarios