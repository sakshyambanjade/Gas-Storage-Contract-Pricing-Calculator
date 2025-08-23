# server/app.py
from __future__ import annotations
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from scipy.stats import norm
from typing import Dict, List

# Optional GARCH support
try:
    from arch import arch_model
    _HAS_ARCH = True
except Exception:
    _HAS_ARCH = False

app = Flask(__name__)
CORS(app)

# -------------------------------
# Helpers
# -------------------------------
def _safe_float(x):
    try:
        if x is None or (isinstance(x, float) and np.isnan(x)):
            return None
        return float(x)
    except Exception:
        return None

def compute_var_cvar(returns: np.ndarray, conf: float = 0.05, horizon: int = 1) -> Dict:
    """
    returns: numpy array of simple returns (e.g. 0.01 = +1%)
    conf: tail probability (e.g. 0.05 for 5% VaR)
    horizon: days to scale
    Returns parametric VaR, historical VaR, CVaR as positive numbers (losses).
    """
    r = np.asarray(returns, dtype=float)
    r = r[~np.isnan(r)]
    if r.size == 0:
        return {"parametric_var": None, "historical_var": None, "cvar": None}

    # parametric (normal) VaR
    mu = r.mean()
    sigma = r.std(ddof=1)
    scale = np.sqrt(horizon)
    # norm.ppf(conf) gives negative for small conf, so parametric VaR = -(mu*horizon + sigma*sqrt(horizon)*norm.ppf(conf))
    param_var = -(mu * horizon + sigma * scale * norm.ppf(conf))

    # historical VaR: quantile of returns
    hist_var = -np.quantile(r, conf)

    # CVaR: average loss beyond quantile
    threshold = np.quantile(r, conf)
    tail = r[r <= threshold]
    if tail.size > 0:
        cvar = -tail.mean()
    else:
        cvar = hist_var

    return {
        "parametric_var": float(param_var),
        "historical_var": float(hist_var),
        "cvar": float(cvar)
    }

# -------------------------------
# Volatility & VaR Endpoint
# -------------------------------
@app.route("/api/volatility", methods=["POST"])
def volatility_endpoint():
    """
    POST JSON:
    {
      "priceData": [ {"date": "YYYY-MM-DD", "price": 1.23}, ... ],
      "var_confidences": [0.01, 0.05, 0.10],   # optional
      "horizon_days": 1,                      # optional
      "rolling_window": 30                    # optional
    }
    """
    try:
        payload = request.get_json(force=True) or {}
        rows = payload.get("priceData") or payload.get("data") or []
        confs = payload.get("var_confidences", [0.01, 0.05, 0.10])
        horizon = int(payload.get("horizon_days", 1))
        rolling_window = int(payload.get("rolling_window", 30))

        if not isinstance(rows, list) or len(rows) < 5:
            return jsonify({"error": "Provide priceData as a list with at least 5 rows"}), 400

        df = pd.DataFrame(rows)
        # Normalize columns
        df.columns = [str(c).strip().lower() for c in df.columns]

        # Pick price column
        if "price" not in df.columns:
            if "close" in df.columns:
                df["price"] = df["close"]
            else:
                return jsonify({"error": "No 'price' (or 'close') column found in priceData"}), 400

        # Parse dates if present
        if "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"], errors="coerce")
            df = df.dropna(subset=["date"])
            df = df.sort_values("date").reset_index(drop=True)
        else:
            # create monotonic index as dates if missing
            df = df.reset_index().rename(columns={"index": "date"})
            df["date"] = pd.to_datetime(df["date"], unit="D", origin="1970-01-01")

        # Ensure numeric price and drop NaNs
        df["price"] = pd.to_numeric(df["price"], errors="coerce")
        df = df.dropna(subset=["price"]).reset_index(drop=True)
        if len(df) < 5:
            return jsonify({"error": "Not enough valid price rows after cleaning"}), 400

        # Compute log returns
        df["log_ret"] = np.log(df["price"]).diff()
        df = df.dropna(subset=["log_ret"]).reset_index(drop=True)
        if len(df) < 3:
            return jsonify({"error": "Not enough returns to analyze"}), 400

        returns_log = df["log_ret"].values
        # convert log returns to simple returns for VaR (r = exp(log_ret)-1)
        simple_returns = np.expm1(returns_log)

        # Basic meta
        result = {
            "rows": int(len(df)),
            "start_date": df["date"].min().strftime("%Y-%m-%d") if "date" in df.columns else None,
            "end_date": df["date"].max().strftime("%Y-%m-%d") if "date" in df.columns else None,
            "model": None,
        }

        # Attempt GARCH(1,1)
        garch_vol_series = None
        garch_forecast_1 = None
        garch_params = None
        if _HAS_ARCH and len(returns_log) > 50:
            try:
                # Fit GARCH on percentage-style (arch likes non-tiny values), multiply by 100
                am = arch_model(returns_log * 100.0, vol="Garch", p=1, q=1, mean="Constant", dist="normal")
                res = am.fit(disp="off")
                cond_var = res.conditional_variance  # in (percent^2)
                cond_vol = np.sqrt(cond_var) / 100.0  # back to decimal daily stdev approx
                # Align last dates
                vol_dates = df["date"].iloc[-len(cond_vol):].dt.strftime("%Y-%m-%d").tolist()
                garch_vol_series = [{"date": d, "vol": float(v)} for d, v in zip(vol_dates, cond_vol.tolist())]

                # 1-step ahead forecast
                forecasts = res.forecast(horizon=1, reindex=False)
                if hasattr(forecasts, "variance"):
                    fvar = forecasts.variance.values[-1, 0]
                    garch_forecast_1 = float(np.sqrt(fvar)) / 100.0
                garch_params = {k: _safe_float(v) for k, v in res.params.items()}
                result["model"] = "GARCH(1,1)"
                result["garch_params"] = garch_params
                result["vol_series_garch"] = garch_vol_series
                result["vol_forecast_garch_1"] = _safe_float(garch_forecast_1)
            except Exception as e:
                # if GARCH fitting fails, we do not stop — fallback to rolling vol
                result["model"] = "GARCH_failed"
                result["garch_error"] = str(e)
        else:
            result["model"] = "rolling_or_no_arch"

        # Rolling volatility (always compute as fallback / baseline)
        if rolling_window < 2:
            rolling_window = 30
        rolling_std = pd.Series(returns_log).rolling(window=rolling_window).std()
        # align dates
        vol_dates = df["date"].iloc[-len(rolling_std):].dt.strftime("%Y-%m-%d").tolist()
        vol_values = rolling_std.fillna(method="bfill").tolist()
        result["rolling_vol"] = [{"date": d, "vol": _safe_float(v)} for d, v in zip(vol_dates, vol_values)]

        # VaR & CVaR for requested confidences
        var_results = {}
        for conf in confs:
            try:
                vr = compute_var_cvar(simple_returns, conf=float(conf), horizon=int(horizon))
                var_results[f"{int(conf*100)}pct"] = vr
            except Exception as e:
                var_results[f"{int(conf*100)}pct"] = {"error": str(e)}

        result["var"] = var_results

        # Return some return stats
        result["return_stats"] = {
            "mean": float(np.nanmean(simple_returns)),
            "std": float(np.nanstd(simple_returns, ddof=1)),
            "skew": float(pd.Series(simple_returns).skew()),
            "kurtosis": float(pd.Series(simple_returns).kurtosis())
        }

        return jsonify({"success": True, "analysis": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Health check
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "has_arch": _HAS_ARCH})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
