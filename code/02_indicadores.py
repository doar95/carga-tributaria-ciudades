"""Indicadores derivados, controles de calidad y base pública final."""
from pathlib import Path
import numpy as np, pandas as pd

D = Path(__file__).resolve().parents[1] / 'data'
I = D / 'intermedios'
p = pd.read_parquet(I / 'panelBase.parquet')
va = pd.read_csv(I / 'valorAgregadoMunicipal2011a2024.csv', dtype={'codigo': str})
p = p.merge(va, on=['codigo', 'anio'], how='left')
p.loc[p['pob'] <= 0, ['pob', 'pobCabecera', 'participacionUrbana']] = np.nan

money = ['ingresosTotales', 'ingresosCorrientes', 'tributarios', 'predial', 'ica', 'otrosTributarios',
         'sobretasaGasolina', 'noTributarios', 'transferenciasCorrientes', 'transferenciasCapital', 'regalias',
         'gastosTotales', 'funcionamiento', 'inversion']
# Constantes de 2025 (millones de COP)
for c in ['tributarios', 'predial', 'ica', 'otrosTributarios', 'ingresosTotales', 'transferenciasCorrientes',
          'transferenciasCapital', 'regalias']:
    p[c + 'Const2025'] = p[c] * p['factor2025']
# Per cápita en COP constantes de 2025
for c in ['tributarios', 'predial', 'ica', 'otrosTributarios']:
    p['pc' + c[0].upper() + c[1:] + '2025'] = p[c] * 1e6 * p['factor2025'] / p['pob']
p['pcTransferencias2025'] = (p['transferenciasCorrientes'].fillna(0) + p['transferenciasCapital'].fillna(0)) * 1e6 * p['factor2025'] / p['pob']
p.loc[p['ingresosTotales'].isna(), 'pcTransferencias2025'] = np.nan
p['pcRegalias2025'] = p['regalias'] * 1e6 * p['factor2025'] / p['pob']
# Salarios mínimos mensuales por habitante (valores corrientes)
p['tributariosSMMLVpc'] = p['tributarios'] * 1e6 / p['pob'] / p['smmlv']
p['predialSMMLVpc'] = p['predial'] * 1e6 / p['pob'] / p['smmlv']
p['icaSMMLVpc'] = p['ica'] * 1e6 / p['pob'] / p['smmlv']
# Estructura
p['autonomiaTributaria'] = p['tributarios'] / p['ingresosTotales']
p['participacionPredial'] = p['predial'] / p['tributarios']
p['participacionICA'] = p['ica'] / p['tributarios']
# Intensidad sobre valor agregado municipal (VA en miles de millones; tributos en millones)
p['tributariosSobreVA'] = p['tributarios'] / (p['vaMunicipal'] * 1e3)
p['pcVA2025'] = p['vaMunicipal'] * 1e9 * p['factor2025'] / p['pob']

p = p.replace([np.inf, -np.inf], np.nan)

# Control de calidad: saltos atípicos en el ingreso tributario real per cápita
p = p.sort_values(['codigo', 'anio'])
lg = np.log(p['pcTributarios2025'].where(p['pcTributarios2025'] > 0))
med = lg.groupby(p['codigo']).transform(lambda s: s.rolling(7, center=True, min_periods=3).median())
p['alertaCalidad'] = ((lg - med).abs() > np.log(3)).astype(int)
p.loc[lg.isna() & p['reporta'].eq(1) & p['pob'].notna(), 'alertaCalidad'] = 1

# Grupos de comparación con categoría fija (vigencia 2025)
def grupo(r):
    if r['codigo'] == '11001':
        return 'Bogotá D.C.'
    c = r['categoria2025']
    if c == 'E':
        return 'Especial (sin Bogotá)'
    if isinstance(c, str):
        return 'Categoría ' + c
    return 'Sin categoría municipal'
p['grupoComparacion'] = p.apply(grupo, axis=1)
p.loc[p['codigo'] == '88001', 'grupoComparacion'] = 'Sin categoría municipal'

orden = ['codigo', 'municipio', 'codDepto', 'departamento', 'anio', 'categoria', 'categoria2025', 'grupoComparacion',
         'pob', 'pobCabecera', 'participacionUrbana', 'smmlv', 'ipcDic', 'factor2025', 'reporta', 'alertaCalidad', 'fuente'] + money + \
        [c for c in p.columns if c.endswith('Const2025')] + \
        ['pcTributarios2025', 'pcPredial2025', 'pcIca2025', 'pcOtrosTributarios2025', 'pcTransferencias2025', 'pcRegalias2025',
         'tributariosSMMLVpc', 'predialSMMLVpc', 'icaSMMLVpc', 'autonomiaTributaria', 'participacionPredial', 'participacionICA',
         'vaMunicipal', 'pcVA2025', 'tributariosSobreVA']
p = p[orden]
p.to_parquet(I / 'panelFinal.parquet', index=False)
pub = p[p.anio >= 1984].copy()
pub.to_csv(D / 'panelCargaTributaria1984a2025.csv', index=False, encoding='utf-8')
print(pub.shape, 'alertas', pub.alertaCalidad.sum())
print(pub.groupby('grupoComparacion').codigo.nunique())
