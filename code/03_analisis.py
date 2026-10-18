"""Análisis descriptivo, presión tributaria y salidas para el sitio web."""
import json
from pathlib import Path
import numpy as np, pandas as pd

R = Path(__file__).resolve().parents[1]
I = R / 'data' / 'intermedios'
OUT = R / 'assets' / 'data'
OUT.mkdir(parents=True, exist_ok=True)
p = pd.read_parquet(I / 'panelFinal.parquet')
p = p[p.anio >= 1985]
ok = p[(p.reporta == 1) & (p.alertaCalidad == 0) & p.pob.notna()]
res = {}

GRUPOS = ['Bogotá D.C.', 'Especial (sin Bogotá)', 'Categoría 1', 'Categoría 2', 'Categoría 3', 'Categoría 4',
          'Categoría 5', 'Categoría 6']
ESPECIALES = {'11001': 'Bogotá', '05001': 'Medellín', '76001': 'Cali', '08001': 'Barranquilla',
              '13001': 'Cartagena', '68001': 'Bucaramanga'}

def agg(d):
    pob = d.pob.sum()
    return pd.Series({
        'pcTrib': d.tributariosConst2025.sum() * 1e6 / pob,
        'pcPredial': d.predialConst2025.sum() * 1e6 / pob,
        'pcIca': d.icaConst2025.sum() * 1e6 / pob,
        'pcOtros': d.otrosTributariosConst2025.sum() * 1e6 / pob,
        'smmlvPc': (d.tributarios.sum() * 1e6 / pob) / d.smmlv.iloc[0],
        'autonomia': d.tributarios.sum() / d.ingresosTotales.sum(),
        'medianaPc': d.pcTributarios2025.median(),
        'n': d.codigo.nunique(), 'pob': pob})

g = ok.groupby(['grupoComparacion', 'anio']).apply(agg).reset_index()
res['grupos'] = {k: v.drop(columns='grupoComparacion').round(4).to_dict('list') for k, v in g.groupby('grupoComparacion') if k in GRUPOS}

esp = p[p.codigo.isin(ESPECIALES)].copy()
esp['ciudad'] = esp.codigo.map(ESPECIALES)
cols = ['anio', 'pcTributarios2025', 'pcPredial2025', 'pcIca2025', 'pcOtrosTributarios2025', 'tributariosSMMLVpc',
        'predialSMMLVpc', 'icaSMMLVpc', 'autonomiaTributaria', 'tributarios', 'tributariosConst2025', 'pob',
        'participacionPredial', 'participacionICA', 'tributariosSobreVA', 'alertaCalidad', 'factor2025', 'smmlv']
res['especiales'] = {c: d[cols].round(5).replace({np.nan: None}).to_dict('list') for c, d in esp.groupby('ciudad')}

# Nacional: impuestos municipales sobre PIB y participación de Bogotá
pib = pd.read_csv(I / 'pibDepartamental1980a2025.csv', dtype={'codDepto': str})
pib2 = pd.read_csv(I / 'pibDepartamental2005a2025.csv', dtype={'codDepto': str})
pibnac = pib.groupby('anio').pibCorriente.sum()
rep = p[p.reporta == 1]
nac = rep.groupby('anio')[['tributarios', 'predial', 'ica', 'otrosTributarios']].sum()
bog = rep[rep.codigo == '11001'].set_index('anio')[['tributarios', 'predial', 'ica']]
nac_out = pd.DataFrame({
    'anio': nac.index,
    'presionNacional': (nac.tributarios / (pibnac.reindex(nac.index) * 1e3)).values,
    'predialPIB': (nac.predial / (pibnac.reindex(nac.index) * 1e3)).values,
    'icaPIB': (nac.ica / (pibnac.reindex(nac.index) * 1e3)).values,
    'participacionBogota': (bog.tributarios.reindex(nac.index) / nac.tributarios).values,
    'municipiosReportan': rep.groupby('anio').codigo.nunique().reindex(nac.index).values,
    'totalConst2025': (rep.groupby('anio').tributariosConst2025.sum() / 1e6).reindex(nac.index).values,
})
mac = p.drop_duplicates('anio').set_index('anio')[['factor2025', 'smmlv', 'ipcDic']].sort_index()
res['macro'] = {'anio': mac.index.tolist(), **{c: mac[c].round(6).tolist() for c in mac}}
res['nacional'] = nac_out.round(6).replace({np.nan: None}).to_dict('list')

# Presión tributaria departamental: suma de tributos municipales del departamento / PIB departamental
rep2 = rep.copy()
rep2['codDepto'] = rep2['codigo'].str[:2]
dep = rep2.groupby(['codDepto', 'anio'])[['tributarios', 'predial', 'ica']].sum().reset_index()
nuevos = ['81', '85', '86', '88', '91', '94', '95', '97', '99']
pibu = pd.concat([pib[(pib.anio < 2005) & (pib.codDepto != '0*')], pib2[pib2.anio >= 2005]])
dep = dep.merge(pibu, on=['codDepto', 'anio'], how='left')
dep['presion'] = dep.tributarios / (dep.pibCorriente * 1e3)
dep['presionPredial'] = dep.predial / (dep.pibCorriente * 1e3)
dep['presionIca'] = dep.ica / (dep.pibCorriente * 1e3)
dep = dep[dep.pibCorriente.notna()]
names = pib2.drop_duplicates('codDepto').set_index('codDepto').nombreDeptoPIB.to_dict()
dep['depto'] = dep.codDepto.map(names)
res['presionDepartamental'] = {c: d[['anio', 'presion', 'presionPredial', 'presionIca']].round(6).to_dict('list')
                               for c, d in dep.groupby('depto')}
# Cobertura del reporte por departamento (población de municipios que reportan / población total)
cov = p.assign(codDepto=p.codigo.str[:2]).groupby(['codDepto', 'anio']).apply(
    lambda d: d.loc[d.reporta == 1, 'pob'].sum() / d.pob.sum()).rename('cobertura').reset_index()
dep = dep.merge(cov, on=['codDepto', 'anio'], how='left')
dep.to_csv(R / 'data' / 'presionTributariaDepartamental1985a2025.csv', index=False)
res['presionDepUltimo'] = dep[dep.anio == 2025][['codDepto', 'depto', 'presion', 'presionPredial', 'presionIca', 'cobertura']].round(6).to_dict('records')
# Intensidad sobre valor agregado municipal para distritos y ciudades de categoría especial (2011 a 2024)
res['vaEspeciales'] = {ESPECIALES[c]: d[['anio', 'tributariosSobreVA']].dropna().round(6).to_dict('list')
                       for c, d in p[p.codigo.isin(ESPECIALES)].groupby('codigo')}

# Desigualdad y dispersión
def gini(x, w):
    o = np.argsort(x); x, w = np.asarray(x)[o], np.asarray(w)[o]
    cw = np.cumsum(w); cxw = np.cumsum(x * w)
    return 1 - 2 * np.trapezoid(cxw / cxw[-1], cw / cw[-1])
disp = []
for y, d in ok.groupby('anio'):
    d = d[(d.pcTributarios2025 > 0) & np.isfinite(d.pcTributarios2025) & (d.pob > 0)]
    r = {'anio': y, 'gini': gini(d.pcTributarios2025.values, d.pob.values)}
    for gname, dd in d.groupby('grupoComparacion'):
        if gname.startswith('Categoría') and len(dd) > 5:
            r['sd_' + gname[-1]] = np.log(dd.pcTributarios2025).std()
    disp.append(r)
res['dispersion'] = pd.DataFrame(disp).round(4).replace({np.nan: None}).to_dict('list')

# Datos de mapa municipal: promedio 2023 a 2025 (reduce ruido anual)
m = ok[ok.anio.between(2023, 2025)].groupby('codigo').agg(
    municipio=('municipio', 'last'), departamento=('departamento', 'last'), categoria=('categoria2025', 'last'),
    pc=('pcTributarios2025', 'mean'), pcPredial=('pcPredial2025', 'mean'), pcIca=('pcIca2025', 'mean'),
    smmlv=('tributariosSMMLVpc', 'mean'), autonomia=('autonomiaTributaria', 'mean'), pob=('pob', 'last')).reset_index()
m0 = ok[ok.anio.between(2003, 2005)].groupby('codigo').pcTributarios2025.mean().rename('pc0')
m = m.merge(m0, on='codigo', how='left')
m['crec'] = (m.pc / m.pc0) ** (1 / 20) - 1
res['mapa'] = m.round(4).replace({np.nan: None}).to_dict('records')

# Tabla de grupos 2025 y 1985
t = g[g.anio.isin([1985, 2000, 2025])]
res['tablaGrupos'] = t.round(4).to_dict('records')
json.dump(res, open(OUT / 'resultados.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('ok', {k: (len(v) if hasattr(v, '__len__') else v) for k, v in res.items()})
print(g[g.anio == 2025][['grupoComparacion', 'pcTrib', 'pcPredial', 'pcIca', 'smmlvPc', 'autonomia', 'medianaPc', 'n']].round(3).to_string())
print(nac_out[nac_out.anio.isin([1985, 1990, 2000, 2010, 2020, 2025])].round(4).to_string())
print(dep[dep.anio == 2025].sort_values('presion', ascending=False)[['depto', 'presion', 'cobertura']].round(4).head(8).to_string())
