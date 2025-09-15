# ml/predict.py
import sys, json, re
from pathlib import Path
import pandas as pd
import numpy as np
from joblib import load

BASE = Path(__file__).resolve().parent
MODEL_PATH = BASE / "artifacts" / "model_iforest.joblib"
FEATS_PATH = BASE / "artifacts" / "features.txt"

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

def canon_key(k: str) -> str:
    k2 = str(k).strip().lower()
    k2 = re.sub(r"\s+", "_", k2)
    k2 = k2.replace("%", "").replace("°c", "c").replace("ug/m3", "").replace("µg/m3", "")
    for pat, canon in ALIAS.items():
        if re.search(pat, k2):
            return canon
    return k2

def coerce_value(v):
    if isinstance(v, (int, float)) and not pd.isna(v):
        return float(v)
    try:
        # extract numeric from strings like "45 %", "1,234.5"
        s = str(v)
        s2 = re.sub(r"[^\d\.\-eE]", "", s)
        return float(s2) if s2 not in ("", "-", ".", "e", "E") else np.nan
    except Exception:
        return np.nan

def main():
    if not MODEL_PATH.exists() or not FEATS_PATH.exists():
        print(json.dumps({"error":"model not trained"}))
        return
    model = load(MODEL_PATH)
    feats = FEATS_PATH.read_text().splitlines()

    raw = sys.stdin.read().strip() or "{}"
    data = json.loads(raw)

    # normalize keys and coerce to numeric
    norm = {}
    for k, v in data.items():
        nk = canon_key(k)
        norm[nk] = coerce_value(v)

    # build row with model's expected features
    row = {f: norm.get(f, np.nan) for f in feats}
    df = pd.DataFrame([row])

    pred = int(model.predict(df)[0])       # -1 anomaly, 1 normal
    score = float(model.decision_function(df)[0])
    print(json.dumps({"pred": pred, "score": score, "used_features": feats}))

if __name__ == "__main__":
    main()
