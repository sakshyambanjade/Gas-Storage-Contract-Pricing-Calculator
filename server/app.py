# app.py
from __future__ import annotations
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from typing import Dict, List

app = Flask(__name__)
CORS(app)

# -------------------------------
# Helpers
# -------------------------------

ALLOWED_EXTS = (".csv", ".xlsx", ".xls", ".json")

# Gas/IoT related columns we try to detect (case-insensitive)
KNOWN_COLS = [
    "date", "price", "spotprice", "futuresprice",
    "open", "high", "low", "close", "volume",
    "pressure", "temperature", "demand", "supply",
    "location", "region", "hub"
]

def _ext(filename: str) -> str:
    return (filename or "").lower().rsplit(".", 1)[-1] if "." in (filename or "") else ""

def read_any_dataframe(file_storage) -> pd.DataFrame:
    name = (file_storage.filename or "").lower()
    if name.endswith(".csv"):
        return pd.read_csv(file_storage)
    if name.endswith(".xlsx") or name.endswith(".xls"):
        return pd.read_excel(file_storage)
    if name.endswith(".json"):
        return pd.read_json(file_storage)
    # Fallback try CSV
    return pd.read_csv(file_storage)

def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]
    # Build mapping to canonical lower-cased names where possible (date/price/etc.)
    mapping = {}
    for c in df.columns:
        lc = c.lower().strip()
        if lc in KNOWN_COLS and lc not in df.columns:
            mapping[c] = lc
        else:
            # If header case differs, still normalize to lowercase
            mapping[c] = lc
    df = df.rename(columns=mapping)
    return df

def coerce_dtypes(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Parse date
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")

    # Numeric candidates (we will convert safely)
    numeric_candidates = set(df.columns) & set([
        "price", "spotprice", "futuresprice",
        "open", "high", "low", "close",
        "volume", "pressure", "temperature",
        "demand", "supply"
    ])
    for col in numeric_candidates:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Basic cleanup
    if "date" in df.columns:
        df = df.dropna(subset=["date"]).sort_values("date")

    return df

def detect_series(df: pd.DataFrame) -> Dict[str, str]:
    """Return a dict indicating which key series exist."""
    present = {}
    for col in ["price", "spotprice", "futuresprice", "close", "open", "high", "low",
                "volume", "pressure", "temperature", "demand", "supply"]:
        if col in df.columns:
            present[col] = col
    return present

def _safe_float(x):
    if pd.isna(x):
        return None
    try:
        return float(x)
    except Exception:
        return None

def compute_core_metrics(df: pd.DataFrame) -> Dict:
    """Compute stats for price-like series and general analytics."""
    out = {
        "rows": int(len(df)),
        "columns": list(df.columns),
        "has_date": bool("date" in df.columns),
    }

    # Choose main price series: prefer 'price', then 'close', then 'spotprice'
    price_col = None
    for candidate in ["price", "close", "spotprice", "futuresprice", "open"]:
        if candidate in df.columns:
            price_col = candidate
            break

    if "date" in df.columns and not df.empty:
        out["start_date"] = df["date"].min().strftime("%Y-%m-%d")
        out["end_date"]   = df["date"].max().strftime("%Y-%m-%d")
    else:
        out["start_date"] = None
        out["end_date"]   = None

    # Stats for all known numeric series that exist
    numeric_cols = [c for c in df.columns if c != "date" and pd.api.types.is_numeric_dtype(df[c])]
    summary = {}
    for col in numeric_cols:
        series = df[col].dropna()
        if series.empty:
            summary[col] = {"mean": None, "std": None, "min": None, "max": None}
        else:
            summary[col] = {
                "mean": _safe_float(series.mean()),
                "std":  _safe_float(series.std()),
                "min":  _safe_float(series.min()),
                "max":  _safe_float(series.max()),
            }
    out["summary"] = summary

    # Additional price analytics
    price_analytics = {}
    if price_col is not None and pd.api.types.is_numeric_dtype(df[price_col]):
        p = df[price_col].astype(float)
        # daily returns (assuming sorted by date already)
        ret = p.pct_change().replace([np.inf, -np.inf], np.nan).dropna()

        # Annualization conventions for daily data
        ann_factor = np.sqrt(252.0)

        # Sharpe (no risk-free for simplicity)
        sharpe = (ret.mean() / (ret.std() + 1e-12)) * ann_factor if not ret.empty else None

        # Volatility (annualized)
        vol = ret.std() * ann_factor if not ret.empty else None

        # Max drawdown (from price series)
        roll_max = p.cummax()
        drawdown = (p / roll_max) - 1.0
        max_dd = drawdown.min() if not drawdown.empty else None

        # Simple z-score anomalies on price
        z = (p - p.mean()) / (p.std() + 1e-12) if p.std() not in (0, np.nan) else pd.Series(index=p.index, data=0.0)
        anomalies_idx = z.index[(z.abs() >= 3)].tolist()
        anomalies = []
        if "date" in df.columns:
            dates = df.loc[anomalies_idx, "date"].dt.strftime("%Y-%m-%d").tolist()
            vals  = p.loc[anomalies_idx].tolist()
            anomalies = [{"date": d, "value": _safe_float(v)} for d, v in zip(dates, vals)]

        # Histogram bins for price
        try:
            counts, bin_edges = np.histogram(p.dropna(), bins=20)
            hist = {
                "bins": [ _safe_float(x) for x in bin_edges.tolist() ],
                "counts": [ int(x) for x in counts.tolist() ]
            }
        except Exception:
            hist = {"bins": [], "counts": []}

        # Weekly / monthly resample (means)
        weekly = None
        monthly = None
        if "date" in df.columns:
            tmp = df[["date", price_col]].dropna().copy()
            tmp = tmp.set_index("date")
            weekly_df = tmp.resample("W").mean().dropna()
            monthly_df = tmp.resample("M").mean().dropna()
            weekly = [{"date": d.strftime("%Y-%m-%d"), price_col: _safe_float(v)} for d, v in weekly_df[price_col].items()]
            monthly = [{"date": d.strftime("%Y-%m-%d"), price_col: _safe_float(v)} for d, v in monthly_df[price_col].items()]

        price_analytics = {
            "price_col": price_col,
            "sharpe": _safe_float(sharpe),
            "vol_annual": _safe_float(vol),
            "max_drawdown": _safe_float(max_dd),
            "histogram": hist,
            "anomalies": anomalies,
            "weekly_avg": weekly,
            "monthly_avg": monthly,
        }

    out["price_analytics"] = price_analytics

    # Correlation matrix among numeric columns
    corr = None
    if len(numeric_cols) >= 2:
        try:
            c = df[numeric_cols].corr()
            corr = {r: {c2: _safe_float(v) for c2, v in c.loc[r].items()} for r in c.index}
        except Exception:
            corr = None
    out["correlations"] = corr

    # Presence map (which typical series exist)
    out["series_present"] = detect_series(df)

    return out

def to_preview_records(df: pd.DataFrame, limit: int = 200) -> List[Dict]:
    """Make preview records JSON-serializable (dates -> ISO)."""
    df = df.copy()
    if "date" in df.columns and pd.api.types.is_datetime64_any_dtype(df["date"]):
        df["date"] = df["date"].dt.strftime("%Y-%m-%d")
    return df.head(limit).to_dict(orient="records")

# -------------------------------
# Routes
# -------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"ok": True})

@app.route("/api/upload-data", methods=["POST"])
def upload_data():
    """
    Accept CSV / Excel / JSON containing gas market and/or IoT sensor data.
    Auto-detect columns, normalize, and return:
      - preview rows (first 200)
      - core analytics (stats, price analytics, correlations, resamples, anomalies)
      - series_present (which series were found)
    """
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file or file.filename.strip() == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        df = read_any_dataframe(file)
        df = normalize_columns(df)
        df = coerce_dtypes(df)

        # Must have at least one useful column
        if df.empty:
            return jsonify({"error": "No rows after parsing"}), 400

        # If there's no date column, we can still analyze numerics, but charts will be limited
        analytics = compute_core_metrics(df)
        preview = to_preview_records(df, limit=200)

        return jsonify({
            "success": True,
            "data": preview,
            "analysis": analytics
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/metrics", methods=["POST"])
def metrics_from_client_data():
    """
    Recompute analytics from client-provided rows (e.g., after filtering in UI).
    Body:
      {
        "rows": [ { "date": "YYYY-MM-DD", "price": 2.3, ... }, ... ]
      }
    """
    try:
        payload = request.get_json(force=True, silent=False) or {}
        rows = payload.get("rows", [])
        if not isinstance(rows, list) or len(rows) == 0:
            return jsonify({"error": "Provide 'rows' as a non-empty list"}), 400

        df = pd.DataFrame(rows)
        df = normalize_columns(df)
        df = coerce_dtypes(df)

        analytics = compute_core_metrics(df)
        preview = to_preview_records(df, limit=200)

        return jsonify({
            "success": True,
            "data": preview,
            "analysis": analytics
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Optional: keep your existing endpoints if you have a pricing engine
# @app.route("/api/calculate-contract", methods=["POST"])
# def calculate_contract():
#     try:
#         payload = request.get_json(force=True) or {}
#         price_data = pd.DataFrame(payload.get("priceData", []))
#         params = payload.get("parameters", {})
#         # results = PricingEngine().calculate_contract_price(price_data, params)
#         results = {"message": "Hook your pricing engine here."}
#         return jsonify(results)
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Run on localhost:5000 by default
    app.run(debug=True, port=5000)
