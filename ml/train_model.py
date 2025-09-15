# ml/train_model.py
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from joblib import dump
import re

BASE = Path(__file__).resolve().parent
DATA = BASE / "data"
ART = BASE / "artifacts"
ART.mkdir(exist_ok=True, parents=True)

# Common alias map -> canonical feature names
ALIAS = {
    r"^pm[_\s]*2\.?5|pm25|pm-?2-?5|pm2_5": "pm25",
    r"^pm[_\s]*10|pm10": "pm10",
    r"^temp(_air)?$|^air[_\s]*temp|temperature$|^temp$": "temp",
    r"^humid|^rh$|humidity": "humidity",
    r"^ph$": "ph",
    r"turbidity|ntu": "turbidity",
    r"soil[_\s]*moist|^moisture$|soilmoisture": "soil_moisture",
    r"soil[_\s]*temp|^soiltemp$": "soil_temp",
}

CANON_ORDER = [
    "pm25", "pm10", "temp", "humidity", "ph", "turbidity", "soil_moisture", "soil_temp"
]

def canonicalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    # Normalize headers
    df = df.copy()
    new_cols = []
    for c in df.columns:
        nc = str(c).strip().lower()
        nc = re.sub(r"\s+", "_", nc)
        nc = nc.replace("%", "").replace("°c", "c").replace("ug/m3", "").replace("µg/m3", "")
        new_cols.append(nc)
    df.columns = new_cols

    # Map aliases to canon names (first match wins)
    mapping = {}
    for col in df.columns:
        for pat, canon in ALIAS.items():
            if re.search(pat, col):
                mapping[col] = canon
                break
    if mapping:
        df = df.rename(columns=mapping)
    return df

def coerce_numeric(df: pd.DataFrame, min_numeric_ratio=0.15) -> pd.DataFrame:
    out = pd.DataFrame(index=df.index)
    for c in df.columns:
        s = df[c]
        # Try to pull numbers out of strings like "45 %", "1,234.5", etc.
        if s.dtype == object:
            s2 = s.astype(str).str.replace(r"[^\d\.\-eE]", "", regex=True)
            s_num = pd.to_numeric(s2, errors="coerce")
        else:
            s_num = pd.to_numeric(s, errors="coerce")
        # Keep if at least min_numeric_ratio non-nulls
        if s_num.notna().mean() >= min_numeric_ratio:
            out[c] = s_num
    return out

def load_all() -> pd.DataFrame:
    frames = []
    for csv in sorted(DATA.glob("*.csv")):
        try:
            df = pd.read_csv(csv)
            if df.empty:
                continue
            df = canonicalize_columns(df)
            df = coerce_numeric(df, min_numeric_ratio=0.10)  # more permissive
            frames.append(df)
            print(f"Loaded {csv.name}: shape={df.shape}")
        except Exception as e:
            print(f"Skipping {csv.name}: {e}")
    if not frames:
        raise SystemExit("No CSV files found or readable in ml/data")
    X = pd.concat(frames, ignore_index=True)

    # Prefer canon features if present; otherwise keep any numeric
    present_canons = [c for c in CANON_ORDER if c in X.columns]
    if present_canons:
        X = X[present_canons]
    else:
        # Fallback: keep all numeric columns that have enough data
        keep = [c for c in X.columns if X[c].notna().sum() >= max(50, int(0.1*len(X)))]
        X = X[keep]

    # As last resort, if still empty, raise helpful error
    if X.shape[1] == 0:
        print("Columns observed after coercion:", list(frames[0].columns))
        raise SystemExit("After coercion, no numeric-like columns remained. "
                         "Check your CSV headers and values.")
    return X

def main():
    X = load_all()
    print("Training on shape:", X.shape, "columns:", list(X.columns))

    pipe = Pipeline(steps=[
        ("impute", SimpleImputer(strategy="median")),
        ("scale", StandardScaler(with_mean=True, with_std=True)),
        ("model", IsolationForest(n_estimators=256, contamination=0.05, random_state=42))
    ])
    pipe.fit(X)

    dump(pipe, ART / "model_iforest.joblib")
    (ART / "features.txt").write_text("\n".join(list(X.columns)))
    print("Saved model:", ART / "model_iforest.joblib")
    print("Saved features:", ART / "features.txt")

if __name__ == "__main__":
    main()
