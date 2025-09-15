import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from joblib import dump

BASE = Path(__file__).resolve().parent
DATA = BASE / "data"
ART = BASE / "artifacts"
ART.mkdir(exist_ok=True, parents=True)

def load_all():
    frames = []
    for csv in sorted(DATA.glob("*.csv")):
        try:
            df = pd.read_csv(csv)
            frames.append(df)
        except Exception as e:
            print(f"Skipping {csv.name}: {e}")
    if not frames:
        raise SystemExit("No CSV files found in ml/data")
    df = pd.concat(frames, ignore_index=True)
    # Keep only numeric columns
    num = df.select_dtypes(include=[np.number]).copy()
    # Drop columns with almost all NaNs
    keep = num.columns[num.notna().mean() > 0.6]
    num = num[keep]
    return num

def main():
    X = load_all()
    print("Training on shape:", X.shape)
    pipe = Pipeline(steps=[
        ("impute", SimpleImputer(strategy="median")),
        ("scale", StandardScaler()),
        ("model", IsolationForest(n_estimators=200, contamination=0.05, random_state=42))
    ])
    pipe.fit(X)
    dump(pipe, ART / "model_iforest.joblib")
    # Save feature list for prediction
    (ART / "features.txt").write_text("\n".join(list(X.columns)))
    print("Saved model to", ART / "model_iforest.joblib")

if __name__ == "__main__":
    main()
