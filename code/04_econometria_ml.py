"""Ejercicios econométricos y de aprendizaje automático."""
import json, warnings
from pathlib import Path
import numpy as np, pandas as pd, openpyxl
import statsmodels.formula.api as smf
from scipy.optimize import minimize
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import RidgeCV
from sklearn.model_selection import GroupKFold
from sklearn.inspection import permutation_importance
from sklearn.metrics import r2_score
warnings.filterwarnings('ignore')

R = Path(__file__).resolve().parents[1]
I = R / 'data' / 'intermedios'
RAW = Path('/home/claude/work/raw')
p = pd.read_parquet(I / 'panelFinal.parquet')
ok = p[(p.reporta == 1) & (p.alertaCalidad == 0) & p.pob.notna() & (p.pcTributarios2025 > 0)].copy()
ok['lpc'] = np.log(ok.pcTributarios2025)
ok['lpred'] = np.log(ok.pcPredial2025.where(ok.pcPredial2025 > 0))
ok['lica'] = np.log(ok.pcIca2025.where(ok.pcIca2025 > 0))
ok['lotr'] = np.log(ok.pcOtrosTributarios2025.where(ok.pcOtrosTributarios2025 > 0))
ok = ok.sort_values(['codigo', 'anio'])
for v in ['lpc', 'lpred', 'lica', 'lotr']:
    prev = ok.groupby('codigo')[v].shift(1)
    gap = ok.groupby('codigo')['anio'].diff()
    ok['d' + v] = np.where(gap == 1, ok[v] - prev, np.nan)
out = {}

# PIB nacional real (series encadenadas, retropolación DANE)
wb = openpyxl.load_workbook(RAW / 'pib_dep_retropolacion_1980_2025.xlsx', read_only=True, data_only=True)
rows = list(wb['Cuadro 2'].iter_rows(values_only=True))
h = [r for r in rows if r[1] and str(r[1]).strip().upper() == 'DEPARTAMENTOS'][0]
yrs = [int(str(y)[:4]) for y in h[2:] if y is not None and str(y)[:4].isdigit()]
col = [r for r in rows if r[1] and str(r[1]).strip().upper() == 'COLOMBIA'][0]
vals = []
for y, v in zip(yrs, col[2:]):
    if not isinstance(v, (int, float)):
        break
    vals.append((y, v))
gdp = pd.Series(dict(vals), dtype=float)
gdpg = np.log(gdp).diff().rename('crecPIB')
ok = ok.merge(gdpg, left_on='anio', right_index=True, how='left')
ok['pequeno'] = ok.categoria2025.isin(['5', '6']).astype(int)

# 1. Ciclo político (mandatos de cuatro años, 2004 a 2025)
cy = ok[ok.anio.between(2004, 2025)].copy()
cy['anioMandato'] = ((cy.anio - 2004) % 4) + 1
ciclo = {}
for k in [2, 3, 4]:
    cy[f'm{k}'] = (cy.anioMandato == k).astype(int)
    cy[f'm{k}p'] = cy[f'm{k}'] * cy.pequeno
for v in ['dlpc', 'dlpred', 'dlica', 'dlotr']:
    d = cy.dropna(subset=[v, 'crecPIB'])
    d = d[d[v].abs() < 1.5]
    res_v = {}
    for nombre, dd in [('todos', d), ('sinPandemia', d[~d.anio.isin([2020, 2021])])]:
        mA = smf.ols(f'{v} ~ m2 + m3 + m4 + crecPIB + C(codigo)', data=dd).fit(cov_type='cluster', cov_kwds={'groups': dd.codigo})
        mB = smf.ols(f'{v} ~ m2p + m3p + m4p + C(anio) + C(codigo)', data=dd).fit(cov_type='cluster', cov_kwds={'groups': dd.codigo})
        res_v[nombre] = {'A': {k: [mA.params[f'm{k}'], mA.bse[f'm{k}']] for k in [2, 3, 4]},
                         'B': {k: [mB.params[f'm{k}p'], mB.bse[f'm{k}p']] for k in [2, 3, 4]},
                         'n': int(mA.nobs)}
    res_v['nMun'] = int(d.codigo.nunique())
    ciclo[v] = res_v
out['ciclo'] = ciclo
print('ciclo', json.dumps(ciclo, default=float)[:600])

# 2. Convergencia beta dentro de categorías, 2005 a 2025 (promedios trienales)
a = ok[ok.anio.between(2004, 2006)].groupby('codigo').agg(l0=('lpc', 'mean'))
b = ok[ok.anio.between(2023, 2025)].groupby('codigo').agg(l1=('lpc', 'mean'), cat=('categoria2025', 'last'), dep=('codDepto', 'last'))
cv = a.join(b, how='inner').dropna()
cv['g'] = (cv.l1 - cv.l0) / 19
cv = cv[cv.cat.notna()]
m1 = smf.ols('g ~ l0', data=cv).fit(cov_type='cluster', cov_kwds={'groups': cv.dep})
m2 = smf.ols('g ~ l0 + C(cat)', data=cv).fit(cov_type='cluster', cov_kwds={'groups': cv.dep})
out['convergencia'] = {'beta_sin': [m1.params['l0'], m1.bse['l0']], 'beta_cat': [m2.params['l0'], m2.bse['l0']],
                       'n': int(m2.nobs), 'r2': m2.rsquared,
                       'puntos': cv.reset_index()[['codigo', 'l0', 'g', 'cat']].round(4).to_dict('records')}
print('convergencia', out['convergencia']['beta_sin'], out['convergencia']['beta_cat'])

# 3. Efectos fijos: elasticidad al valor agregado y asociación con transferencias (2011 a 2024)
fe = ok[ok.anio.between(2012, 2024)].copy()
fe['lva'] = np.log(fe.pcVA2025)
fe['lpob'] = np.log(fe.pob)
fe['ltr'] = np.log(fe.groupby('codigo').pcTransferencias2025.shift(1).where(lambda s: s > 0))
fe = fe.dropna(subset=['lpc', 'lva', 'lpob', 'participacionUrbana'])
m3 = smf.ols('lpc ~ lva + lpob + participacionUrbana + C(anio) + C(codigo)', data=fe).fit(cov_type='cluster', cov_kwds={'groups': fe.codigo})
fe2 = fe.dropna(subset=['ltr'])
m4 = smf.ols('lpc ~ lva + lpob + participacionUrbana + ltr + C(anio) + C(codigo)', data=fe2).fit(cov_type='cluster', cov_kwds={'groups': fe2.codigo})
def tab(m, ks):
    return {k: [m.params[k], m.bse[k], m.pvalues[k]] for k in ks if k in m.params}
out['efectosFijos'] = {'m3': tab(m3, ['lva', 'lpob', 'participacionUrbana']), 'm4': tab(m4, ['lva', 'lpob', 'participacionUrbana', 'ltr']),
                       'n3': int(m3.nobs), 'n4': int(m4.nobs), 'r2w3': None}
print('FE', out['efectosFijos'])

# 4. Control sintético: Barranquilla, tratamiento 2008
def synth(target, pre, post, donors, panel):
    Y = panel.pivot_table(index='anio', columns='codigo', values='lpc')
    Y = Y.loc[pre[0]:post[1]]
    Y = Y.dropna(axis=1)
    donors = [d for d in donors if d in Y.columns and d != target]
    y1 = Y[target].values
    Y0 = Y[donors].values
    pm = (Y.index >= pre[0]) & (Y.index <= pre[1])
    n = len(donors)
    f = lambda w: np.sum((y1[pm] - Y0[pm] @ w) ** 2)
    cons = ({'type': 'eq', 'fun': lambda w: w.sum() - 1},)
    r = minimize(f, np.ones(n) / n, bounds=[(0, 1)] * n, constraints=cons, method='SLSQP', options={'maxiter': 500})
    w = r.x
    synth_ = Y0 @ w
    gap = y1 - synth_
    rmspe_pre = np.sqrt(np.mean(gap[pm] ** 2)); rmspe_post = np.sqrt(np.mean(gap[~pm] ** 2))
    return dict(anios=list(Y.index), real=y1.tolist(), sint=synth_.tolist(), gap=gap.tolist(),
                pesos={donors[i]: float(w[i]) for i in np.argsort(-w)[:8] if w[i] > 0.01},
                ratio=float(rmspe_post / rmspe_pre), rmspePre=float(rmspe_pre))
# Panel de donantes: municipios de categoría especial, 1 y 2 con más de 150 mil habitantes en 2005, excluida Bogotá
big = ok[(ok.anio == 2005) & (ok.pob > 150000) & ok.categoria2025.isin(['E', '1', '2'])].codigo.unique().tolist()
big = [c for c in big if c != '11001']
sp = ok[ok.codigo.isin(big + ['08001'])]
names = p.drop_duplicates('codigo').set_index('codigo').municipio.to_dict()
sc = synth('08001', (2000, 2007), (2008, 2025), big, sp)
sc['pesos'] = {names.get(k, k): v for k, v in sc['pesos'].items()}
plac = []
for c in big:
    try:
        r = synth(c, (2000, 2007), (2008, 2025), [d for d in big if d != c] + [], sp[sp.codigo != '08001'])
        plac.append({'codigo': c, 'municipio': names.get(c), 'ratio': r['ratio'], 'gap': r['gap'], 'rmspePre': r['rmspePre']})
    except Exception as e:
        pass
rank = 1 + sum(1 for q in plac if q['ratio'] >= sc['ratio'])
sc['placebos'] = [{'municipio': q['municipio'], 'gap': np.round(q['gap'], 4).tolist(), 'ratio': q['ratio']} for q in plac if q['rmspePre'] < 5 * sc['rmspePre']]
sc['pValor'] = rank / (len(plac) + 1)
sc['nDonantes'] = len(big)
out['sintetico'] = sc
print('sintetico', sc['pesos'], 'ratio', round(sc['ratio'], 2), 'p', round(sc['pValor'], 3), 'gap2025', round(sc['gap'][-1], 3))

# 5. Detección de quiebres: aceleración del crecimiento real per cápita (2000 a 2025)
qb = []
for c in sorted(set(big + ['08001', '11001'])):
    s = ok[(ok.codigo == c) & ok.anio.between(2000, 2025)].set_index('anio').lpc
    if len(s) < 20:
        continue
    best = None
    t = s.index.values.astype(float)
    for k in range(2005, 2021):
        x = np.column_stack([np.ones_like(t), t - k, np.maximum(t - k, 0)])
        beta, rss, *_ = np.linalg.lstsq(x, s.values, rcond=None)
        rss = float(np.sum((s.values - x @ beta) ** 2))
        if best is None or rss < best[1]:
            best = (k, rss, beta)
    x0 = np.column_stack([np.ones_like(t), t]); b0 = np.linalg.lstsq(x0, s.values, rcond=None)[0]
    rss0 = float(np.sum((s.values - x0 @ b0) ** 2))
    F = (rss0 - best[1]) / (best[1] / (len(s) - 3))
    qb.append({'codigo': c, 'municipio': names.get(c), 'anioQuiebre': best[0], 'crecAntes': best[2][1],
               'crecDespues': best[2][1] + best[2][2], 'aceleracion': best[2][2], 'F': F})
qb = pd.DataFrame(qb).sort_values('aceleracion', ascending=False)
gr = []
for c in sorted(set(big + ['08001', '11001'])):
    s0 = ok[(ok.codigo == c) & ok.anio.between(2004, 2006)].lpc.mean(); s1 = ok[(ok.codigo == c) & ok.anio.between(2023, 2025)].lpc.mean()
    gr.append({'codigo': c, 'municipio': names.get(c), 'crec': (s1 - s0) / 19, 'pc0': float(np.exp(s0)), 'pc1': float(np.exp(s1))})
out['crecimientoGrandes'] = pd.DataFrame(gr).sort_values('crec', ascending=False).round(4).to_dict('records')
# medianas anuales de crecimiento real por componente
med = ok[ok.anio >= 2004].groupby('anio')[['dlpc', 'dlpred', 'dlica', 'dlotr']].median()
out['medianasCrecimiento'] = {'anio': med.index.tolist(), **{c: med[c].round(4).tolist() for c in med}}
out['quiebres'] = qb.round(4).to_dict('records')
print(qb.head(12).round(3).to_string())

# 6. Aprendizaje automático: determinantes del recaudo per cápita (2012 a 2024)
ml = fe2.copy()
ml['lreg'] = np.log1p(ml.groupby('codigo').pcRegalias2025.shift(1).fillna(0))
catmap = {'E': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6}
ml['catNum'] = ml.categoria2025.map(catmap)
ml['depNum'] = ml.codDepto.astype(int)
ml = ml.dropna(subset=['catNum', 'lreg', 'ltr'])
feats = ['lva', 'lpob', 'participacionUrbana', 'ltr', 'lreg', 'catNum', 'depNum', 'anio']
etiquetas = {'lva': 'Valor agregado por habitante (log)', 'lpob': 'Población (log)', 'participacionUrbana': 'Participación urbana',
             'ltr': 'Transferencias por habitante, rezago (log)', 'lreg': 'Regalías por habitante, rezago (log)',
             'catNum': 'Categoría municipal', 'depNum': 'Departamento', 'anio': 'Año'}
X, y, gr = ml[feats].values, ml.lpc.values, ml.codigo.values
gkf = GroupKFold(n_splits=5)
oof = np.zeros(len(y)); oofl = np.zeros(len(y)); imps = []
for tr, te in gkf.split(X, y, gr):
    hgb = HistGradientBoostingRegressor(max_iter=400, learning_rate=0.05, max_leaf_nodes=31, min_samples_leaf=40,
                                        categorical_features=[feats.index('depNum')], random_state=7)
    hgb.fit(X[tr], y[tr]); oof[te] = hgb.predict(X[te])
    lin = RidgeCV(alphas=np.logspace(-3, 3, 13)).fit(np.column_stack([X[tr][:, :6], pd.get_dummies(ml.depNum).values[tr]]), y[tr])
    oofl[te] = lin.predict(np.column_stack([X[te][:, :6], pd.get_dummies(ml.depNum).values[te]]))
    pi = permutation_importance(hgb, X[te], y[te], n_repeats=5, random_state=7, scoring='r2')
    imps.append(pi.importances_mean)
imp = pd.Series(np.mean(imps, axis=0), index=feats).sort_values(ascending=False)
out['ml'] = {'r2Boosting': r2_score(y, oof), 'r2Lineal': r2_score(y, oofl), 'n': int(len(y)), 'nMun': int(ml.codigo.nunique()),
             'importancia': [{'variable': etiquetas[k], 'valor': float(v)} for k, v in imp.items()]}
print('ML', out['ml']['r2Boosting'], out['ml']['r2Lineal']); print(imp.round(3))
# Índice de esfuerzo relativo: recaudo observado / recaudo predicho fuera de muestra (promedio 2022 a 2024)
ml['pred'] = oof
ml['esfuerzo'] = np.exp(ml.lpc - ml.pred)
ef = ml[ml.anio.between(2022, 2024)].groupby('codigo').agg(esfuerzo=('esfuerzo', 'mean'), cat=('categoria2025', 'last'),
        pob=('pob', 'last'), pc=('pcTributarios2025', 'mean'), pcPred=('pred', lambda s: float(np.exp(s).mean()))).reset_index()
ef['municipio'] = ef.codigo.map(names)
out['esfuerzo'] = ef.round(4).to_dict('records')
# Brecha: recaudo adicional si los municipios con esfuerzo menor a 1 alcanzaran su recaudo predicho (COP 2025)
ef['brecha'] = np.where(ef.esfuerzo < 1, (ef.pcPred - ef.pc) * ef.pob, 0)
bre = ef.groupby('cat').agg(brecha=('brecha', 'sum'), n=('codigo', 'size'), nBajo=('esfuerzo', lambda s: int((s < 1).sum())),
                            recaudo=('pc', lambda s: float((s * ef.loc[s.index, 'pob']).sum()))).reset_index()
out['brecha'] = bre.round(0).to_dict('records')
print(bre)
json.dump(out, open(R / 'assets' / 'data' / 'econometria.json', 'w'), ensure_ascii=False, default=float, separators=(',', ':'))
