import sys, json
from pathlib import Path
import pandas as pd
import numpy as np
from joblib import load

BASE = Path(__file__).resolve().parent
MODEL_PATH = BASE / "artifacts" / "model_iforest.joblib"
FEATS_PATH = BASE / "artifacts" / "features.txt"

def main():
    if not MODEL_PATH.exists():
        print(json.dumps({"error":"model not trained"}))
        return
    model = load(MODEL_PATH)
    feats = FEATS_PATH.read_text().splitlines()
    # Read JSON from stdin
    raw = sys.stdin.read()
    data = json.loads(raw)
    # Expect an object with numeric fields
    df = pd.DataFrame([data])
    # keep only required features, add missing as NaN
    for f in feats:
        if f not in df.columns:
            df[f] = np.nan
    df = df[feats]
    # Predict anomaly (-1) or normal (1)
    pred = model.predict(df)[0]
    score = float(model.decision_function(df)[0])
    print(json.dumps({"pred": int(pred), "score": score}))

if __name__ == "__main__":
    main()
