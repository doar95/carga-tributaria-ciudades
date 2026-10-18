"""
Construcción del panel municipal de carga tributaria, Colombia 1984 a 2025.

Entradas (carpeta RAW, archivos oficiales descargados de DNP, DANE, Banco de la República y CGN):
  ej_1984_1992_a.xls, ej_1993_1999.xls  Ejecuciones presupuestales municipales (DNP), millones de COP corrientes
  oec_2000_2025.xlsx                    Operaciones Efectivas de Caja municipales 2000 a 2025 (DNP)
  pob_1985_1994.xlsx, pob_1995_2004.xlsx, pob_2005_2017_sexoedad.xlsx, pob_2018_2042.xlsx  (DANE)
  deflactores.xlsx (hoja Deflactor Hist.Banrep), anex-IPC-Indices-sep2026.xlsx (DANE)
  salario_minimo.xlsx (Banco de la República)
  cgn_categorizacion_historicos.xlsx (Contaduría General de la Nación)
  pib_dep_retropolacion_1980_2025.xlsx, va_municipal_2011_2024.xlsx (DANE, cuentas departamentales)

Salidas en data/: panelCargaTributaria.csv y archivos intermedios.
"""
import sys, re, unicodedata
from pathlib import Path
import numpy as np, pandas as pd, openpyxl

RAW = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/home/claude/work/raw')
OUT = Path(__file__).resolve().parents[1] / 'data'
INT = OUT / 'intermedios'
INT.mkdir(parents=True, exist_ok=True)

def norm(s):
    s = unicodedata.normalize('NFKD', str(s)).encode('ascii', 'ignore').decode().upper()
    return re.sub(r'\s+', ' ', s).strip()

# 1. Ejecuciones presupuestales 1984 a 1999 (formato largo)
MAP_OLD = {
    'INGRESOS TOTALES': 'ingresosTotales',
    '1. INGRESOS CORRIENTES': 'ingresosCorrientes',
    '1.1 INGRESOS TRIBUTARIOS': 'tributarios',
    '1.1.1. PREDIAL': 'predial',
    '1.1.2. INDUSTRIA Y COMERCIO': 'ica',
    '1.1.3. OTROS': 'otrosTributarios',
    '1.2. INGRESOS NO TRIBUTARIOS': 'noTributarios',
    '1.3. TRANSFERENCIAS': 'transferenciasCorrientes',
    '4.2. TRANSFERENCIAS NACIONALES (SGP, ETC.)': 'transferenciasCapital',
    '4.1. REGALIAS': 'regalias',
    'GASTOS TOTALES': 'gastosTotales',
    '2.1. FUNCIONAMIENTO': 'funcionamiento',
    '5. GASTOS DE CAPITAL (INVERSION)': 'inversion',
}
old = []
for f in ['ej_1984_1992_a.xls', 'ej_1993_1999.xls']:
    x = pd.read_excel(RAW / f, header=2, dtype={'CODIGO': str})
    x['cuenta'] = x['CUENTA'].map(norm)
    x = x[x['cuenta'].isin(MAP_OLD)].copy()
    x['var'] = x['cuenta'].map(MAP_OLD)
    ycols = [c for c in x.columns if re.fullmatch(r'A\d{4}', str(c))]
    l = x.melt(id_vars=['CODIGO', 'ENTIDAD', 'var'], value_vars=ycols, var_name='anio', value_name='v')
    l['anio'] = l['anio'].str[1:].astype(int)
    old.append(l)
old = pd.concat(old)
old['v'] = pd.to_numeric(old['v'], errors='coerce')
old = old.pivot_table(index=['CODIGO', 'anio'], columns='var', values='v', aggfunc='sum').reset_index()
old = old.rename(columns={'CODIGO': 'codigo'})
old['sobretasaGasolina'] = np.nan  # no desagregada antes de 2000; incluida en otros
old['fuente'] = 'DNP ejecuciones presupuestales'

# 2. OEC 2000 a 2025
wb = openpyxl.load_workbook(RAW / 'oec_2000_2025.xlsx', read_only=True, data_only=False)
ws = wb['2000-2025']
rows = list(ws.iter_rows(min_row=18, values_only=True))
hdr = rows[0]
oec = pd.DataFrame(rows[1:], columns=[str(h).strip() if h else f'c{i}' for i, h in enumerate(hdr)])
oec = oec[oec['Código Municipio'].notna()]
MAP_OEC = {
    'Código Municipio': 'codigo', 'Año': 'anio', 'INGRESOS TOTALES': 'ingresosTotales',
    'Ingresos Corrientes': 'ingresosCorrientes', 'Ingresos tributarios': 'tributarios', 'Predial': 'predial',
    'Industria y comercio': 'ica', 'Sobretasa a la gasolina': 'sobretasaGasolina',
    'Otros ingresos tributarios': 'otrosTributariosSinSobretasa', 'Ingresos No Tributarios': 'noTributarios',
    'Transferencias corrientes': 'transferenciasCorrientes', 'Transferencias nacionales': 'transferenciasCapital',
    'Regalías': 'regalias', 'GASTOS TOTALES': 'gastosTotales', 'Gastos de funcionamiento': 'funcionamiento',
    'Gastos de Capital': 'inversion',
}
oec = oec[[c for c in MAP_OEC]].rename(columns=MAP_OEC)
oec['codigo'] = oec['codigo'].astype(str).str.zfill(5)
for c in oec.columns:
    if c != 'codigo':
        oec[c] = pd.to_numeric(oec[c], errors='coerce')
oec['anio'] = oec['anio'].astype(int)
oec['otrosTributarios'] = oec['otrosTributariosSinSobretasa'].fillna(0) + oec['sobretasaGasolina'].fillna(0)
oec = oec.drop(columns='otrosTributariosSinSobretasa')
oec['fuente'] = 'DNP OEC'
fis = pd.concat([old[old.anio < 2000], oec], ignore_index=True)

# Registros sin reporte: ingresos totales nulos o cero se tratan como dato faltante
sinrep = fis['ingresosTotales'].isna() | (fis['ingresosTotales'] <= 0)
fis['reporta'] = (~sinrep).astype(int)
numcols = ['ingresosTotales', 'ingresosCorrientes', 'tributarios', 'predial', 'ica', 'otrosTributarios',
           'sobretasaGasolina', 'noTributarios', 'transferenciasCorrientes', 'transferenciasCapital', 'regalias',
           'gastosTotales', 'funcionamiento', 'inversion']
fis.loc[sinrep, numcols] = np.nan

# 3. Población DANE
def pob_area(f, sheet, hdr_row, code_col, year_col, area_col, val_col):
    wb = openpyxl.load_workbook(RAW / f, read_only=True)
    ws = wb[sheet]
    recs = []
    for r in ws.iter_rows(min_row=hdr_row + 1, values_only=True):
        if r[code_col] is None or r[year_col] is None:
            continue
        recs.append((str(r[code_col]).zfill(5), int(r[year_col]), str(r[area_col]).strip().upper(), r[val_col]))
    d = pd.DataFrame(recs, columns=['codigo', 'anio', 'area', 'pob'])
    d['pob'] = pd.to_numeric(d['pob'], errors='coerce')
    return area_a_total(d)

def area_a_total(d):
    d = d[d.area != 'TOTAL']
    tot = d.groupby(['codigo', 'anio'], as_index=False)['pob'].sum()
    cab = d[d.area.str.startswith('CABECERA')].groupby(['codigo', 'anio'], as_index=False)['pob'].sum().rename(columns={'pob': 'pobCabecera'})
    return tot.merge(cab, on=['codigo', 'anio'], how='left')

p1 = pob_area('pob_1985_1994.xlsx', 'Municipal', 12, 2, 4, 5, 6)
p2 = pob_area('pob_1995_2004.xlsx', 'Municipal', 12, 2, 4, 5, 6)
p4 = pob_area('pob_2018_2042.xlsx', 'PobMunicipalxÁrea', 8, 2, 4, 5, 6)
# 2005 a 2017: archivo por sexo y edad; se suma la columna total por área
wb = openpyxl.load_workbook(RAW / 'pob_2005_2017_sexoedad.xlsx', read_only=True)
ws = wb['NuevaMpal']
it = ws.iter_rows(min_row=12, values_only=True)
h = next(it)
idx_tot = [i for i, c in enumerate(h) if c and 'Total' in str(c) and 'General' in str(c)]
idx_tot = idx_tot[0] if idx_tot else None
recs = []
for r in it:
    if r[3] is None or r[4] is None:
        continue
    if idx_tot is not None:
        v = r[idx_tot]
    else:
        v = sum(x for x in r[6:] if isinstance(x, (int, float)))
    recs.append((str(r[3]).zfill(5), int(r[4]), str(r[5]).strip().upper(), v))
p3 = area_a_total(pd.DataFrame(recs, columns=['codigo', 'anio', 'area', 'pob']))
pob = pd.concat([p1, p2, p3, p4[p4.anio <= 2026]], ignore_index=True)
pob = pob[pob.anio.between(1985, 2025)]
pob.loc[pob.pob <= 0, ['pob', 'pobCabecera']] = np.nan
pob = pob.groupby(['codigo', 'anio'], as_index=False)[['pob', 'pobCabecera']].sum()
pob['participacionUrbana'] = pob['pobCabecera'] / pob['pob']
pob.to_csv(INT / 'poblacionMunicipal1985a2025.csv', index=False)
print('poblacion', pob.shape, pob.anio.min(), pob.anio.max(), 'Bogota 2025', pob.query("codigo=='11001' and anio==2025").pob.values)

# 4. IPC (diciembre, base dic 2018 = 100) y salario mínimo
d = pd.read_excel(RAW / 'deflactores.xlsx', sheet_name='Deflactor Hist.Banrep', header=1)
ipc = d[['Año', 'IPC']].rename(columns={'Año': 'anio', 'IPC': 'ipc'})
ipc = ipc[pd.to_numeric(ipc.ipc, errors='coerce').notna()].astype({'anio': int, 'ipc': float})
dane = pd.read_excel(RAW / 'anex-IPC-Indices-sep2026.xlsx', header=None)
hdr = dane.iloc[8]
dic = dane[dane[0] == 'Diciembre'].iloc[0]
dane_ipc = pd.DataFrame({'anio': [int(float(y)) for y in hdr[1:]], 'ipcDane': [float(v) for v in dic[1:]]}).dropna()
ipc = ipc.merge(dane_ipc, on='anio', how='outer')
ipc['ipcDic'] = ipc['ipcDane'].combine_first(ipc['ipc'])
ipc['fuenteIPC'] = np.where(ipc['ipcDane'].notna(), 'DANE', 'Banco de la Republica')
ipc = ipc[ipc.anio.between(1984, 2025)][['anio', 'ipcDic', 'fuenteIPC']].sort_values('anio')
base = ipc.loc[ipc.anio == 2025, 'ipcDic'].item()
ipc['factor2025'] = base / ipc['ipcDic']
s = pd.read_excel(RAW / 'salario_minimo.xlsx', sheet_name='Series de datos', header=None)
s = s.iloc[3:, [0, 2]]
s.columns = ['fecha', 'smmlv']
s['smmlv'] = pd.to_numeric(s['smmlv'], errors='coerce')
s = s.dropna()
s['anio'] = pd.to_datetime(s['fecha']).dt.year
macro = ipc.merge(s[['anio', 'smmlv']], on='anio', how='left')
macro.to_csv(INT / 'ipcSalarioMinimo.csv', index=False)
print(macro.tail(3))

# 5. Categorías CGN (vigencia t)
wb = openpyxl.load_workbook(RAW / 'cgn_categorizacion_historicos.xlsx', read_only=True)
ws = wb['HISTORIA-CAT-MUNIC']
rows = list(ws.iter_rows(values_only=True))
r5 = rows[5]
catcols = {}
for j, v in enumerate(r5):
    if v == 'Vigencia' and j + 1 < len(r5):
        try:
            y = int(str(r5[j + 1]).strip())
        except Exception:
            continue
        if y <= 2025:
            catcols[y] = j
cats = []
for r in rows[7:]:
    if r[2] is None:
        continue
    code = str(r[2]).split('.')[0].zfill(5)
    for y, j in catcols.items():
        v = r[j]
        if v is None:
            continue
        v = str(v).strip().upper()
        if v in ('ESP', 'E', 'ESPECIAL'):
            c = 'E'
        elif v in ('1', '2', '3', '4', '5', '6'):
            c = v
        else:
            continue
        cats.append((code, y, c))
cat = pd.DataFrame(cats, columns=['codigo', 'anio', 'categoria']).drop_duplicates(['codigo', 'anio'])
cat.to_csv(INT / 'categoriasCGN2003a2025.csv', index=False)
print('categorias', cat.shape, cat.anio.min(), cat.anio.max(), cat.query("anio==2025").categoria.value_counts().to_dict())

# 6. Panel
names = pd.read_excel(RAW / 'pob_2018_2042.xlsx', sheet_name='PobMunicipalxÁrea', header=7, dtype=str)
names = names.rename(columns={'DP': 'codDepto', 'DPNOM': 'departamento', 'MPIO': 'codigo', 'DPMP': 'municipio'})
names = names[['codigo', 'municipio', 'codDepto', 'departamento']].dropna().drop_duplicates('codigo')
names['codigo'] = names['codigo'].str.zfill(5)

panel = fis.merge(pob, on=['codigo', 'anio'], how='left').merge(macro, on='anio', how='left')
panel = panel.merge(cat, on=['codigo', 'anio'], how='left').merge(names, on='codigo', how='left')
panel['codDepto'] = panel['codDepto'].fillna(panel['codigo'].str[:2])
ref = cat[cat.anio == 2025][['codigo', 'categoria']].rename(columns={'categoria': 'categoria2025'})
panel = panel.merge(ref, on='codigo', how='left')
panel = panel[panel.anio.between(1984, 2025)].sort_values(['codigo', 'anio'])
panel.to_parquet(INT / 'panelBase.parquet', index=False)
print('panel', panel.shape, panel.codigo.nunique())

# 7. PIB departamental (corrientes, miles de millones) y valor agregado municipal
wb = openpyxl.load_workbook(RAW / 'pib_dep_retropolacion_1980_2025.xlsx', read_only=True, data_only=True)
rows = list(wb['Cuadro 1'].iter_rows(min_row=10, values_only=True))
years = [int(str(y)[:4]) for y in rows[0][2:] if y is not None and str(y)[:4].isdigit()]
recs = []
for r in rows[1:]:
    if r[0] is None or r[1] is None:
        continue
    for y, v in zip(years, r[2:2 + len(years)]):
        if isinstance(v, (int, float)):
            recs.append((str(r[0]).split('.')[0].zfill(2), str(r[1]).strip(), y, v))
pib = pd.DataFrame(recs, columns=['codDepto', 'nombreDeptoPIB', 'anio', 'pibCorriente']).drop_duplicates(['codDepto', 'anio'], keep='first')
pib.to_csv(INT / 'pibDepartamental1980a2025.csv', index=False)
print('pib', pib.shape, pib.query("codDepto=='11' and anio==2025"))
wb = openpyxl.load_workbook(RAW / 'va_municipal_2011_2024.xlsx', read_only=True, data_only=True)
rows = list(wb['Cuadro 1'].iter_rows(min_row=11, values_only=True))
hdrv = rows[0]
yidx = [(i, int(str(h)[:4])) for i, h in enumerate(hdrv) if h is not None and str(h)[:4].isdigit()]
recs = []
for r in rows[1:]:
    if r[0] is None or not str(r[0]).strip()[:1].isdigit():
        continue
    for i, y in yidx:
        if isinstance(r[i], (int, float)):
            recs.append((str(r[0]).strip().zfill(5), y, r[i]))
va = pd.DataFrame(recs, columns=['codigo', 'anio', 'vaMunicipal']).drop_duplicates(['codigo', 'anio'], keep='first')
va.to_csv(INT / 'valorAgregadoMunicipal2011a2024.csv', index=False)
print('va', va.shape, va.query("codigo=='11001'").tail(2))
wb = openpyxl.load_workbook(RAW / 'pib_dep_total_2005_2025.xlsx', read_only=True, data_only=True)
rows = list(wb['Cuadro 1'].iter_rows(min_row=10, values_only=True))
years = [int(str(y)[:4]) for y in rows[0][2:] if y is not None and str(y)[:4].isdigit()]
recs = []
for r in rows[1:]:
    if r[0] is None or r[1] is None:
        continue
    for y, v in zip(years, r[2:2 + len(years)]):
        if isinstance(v, (int, float)):
            recs.append((str(r[0]).split('.')[0].zfill(2), str(r[1]).strip(), y, v))
pib2 = pd.DataFrame(recs, columns=['codDepto', 'nombreDeptoPIB', 'anio', 'pibCorriente']).drop_duplicates(['codDepto', 'anio'], keep='first')
pib2.to_csv(INT / 'pibDepartamental2005a2025.csv', index=False)
chk = pib.merge(pib2, on=['codDepto', 'anio'], suffixes=('Retro', 'Base'))
print('comparacion retropolada vs base 2005', chk.query("anio==2005")[['codDepto', 'pibCorrienteRetro', 'pibCorrienteBase']].head(4))
