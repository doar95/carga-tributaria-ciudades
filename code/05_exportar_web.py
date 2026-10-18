"""Exporta series compactas por municipio para el explorador web."""
import json
from pathlib import Path
import numpy as np, pandas as pd
R = Path(__file__).resolve().parents[1]
p = pd.read_parquet(R / 'data' / 'intermedios' / 'panelFinal.parquet')
p = p[p.anio >= 1985]
anios = list(range(1985, 2026))
vars_ = {'pc': ('pcTributarios2025', 0), 'pp': ('pcPredial2025', 0), 'pi': ('pcIca2025', 0), 'po': ('pcOtrosTributarios2025', 0),
         'sm': ('tributariosSMMLVpc', 4), 'au': ('autonomiaTributaria', 4), 'tc': ('tributarios', 1), 'tk': ('tributariosConst2025', 1),
         'pob': ('pob', 0), 'al': ('alertaCalidad', 0)}
mun = {}
for c, d in p.groupby('codigo'):
    d = d.set_index('anio').reindex(anios)
    rec = {'n': d.municipio.dropna().iloc[-1] if d.municipio.notna().any() else c,
           'd': d.departamento.dropna().iloc[-1] if d.departamento.notna().any() else '',
           'c': d.categoria2025.dropna().iloc[-1] if d.categoria2025.notna().any() else None,
           'cat': [x if isinstance(x, str) else None for x in d.categoria.tolist()]}
    for k, (col, dec) in vars_.items():
        v = d[col].round(dec)
        if k != 'al':
            v = v.where(d.reporta == 1)
        rec[k] = [None if pd.isna(x) else (int(x) if dec == 0 else float(x)) for x in v]
    mun[c] = rec
json.dump({'anios': anios, 'm': mun}, open(R / 'assets' / 'data' / 'series.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print((R / 'assets' / 'data' / 'series.json').stat().st_size / 1e6, 'MB')
