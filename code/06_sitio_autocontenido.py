"""
Genera una versión autocontenida del sitio en sitio_autocontenido/: index.html y explorador.html
con estilos, scripts y datos incrustados. Se abren con doble clic, sin servidor; solo necesitan
internet para cargar la librería Plotly y las fuentes tipográficas.
"""
import json, re
from pathlib import Path
R = Path(__file__).resolve().parents[1]
OUT = R / 'sitio_autocontenido'
OUT.mkdir(exist_ok=True)
DATA = {
    'index.html': ['assets/data/resultados.json', 'assets/data/econometria.json', 'assets/data/geo/municipios.geojson', 'assets/data/geo/departamentos.geojson'],
    'explorador.html': ['assets/data/series.json', 'assets/data/resultados.json', 'assets/data/geo/municipios.geojson'],
}
world = (R / 'assets/data/geo/world_110m.json').read_text(encoding='utf-8')
for page, files in DATA.items():
    h = (R / page).read_text(encoding='utf-8')
    def css(m):
        return '<style>\n' + (R / m.group(1)).read_text(encoding='utf-8') + '\n</style>'
    h = re.sub(r'<link rel="stylesheet" href="(assets/css/[^"]+)">', css, h)
    emb = {f: json.loads((R / f).read_text(encoding='utf-8')) for f in files}
    pre = ('<script>window.EMBED = ' + json.dumps(emb, ensure_ascii=False, separators=(',', ':')) + ';\n'
           'window.PlotlyGeoAssets = { topojson: { world_110m: ' + world + ' } };</script>\n')
    def js(m):
        return '<script>\n' + (R / m.group(1)).read_text(encoding='utf-8').replace('</script', '<\\/script') + '\n</script>'
    first = True
    def js_first(m):
        nonlocal_first = js(m)
        return nonlocal_first
    h = h.replace('<script src="assets/js/common.js"></script>', pre + '<script src="assets/js/common.js"></script>', 1)
    h = re.sub(r'<script src="(assets/js/[^"]+)"></script>', js, h)
    h = h.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<!-- Versión autocontenida generada por code/06_sitio_autocontenido.py -->', 1)
    (OUT / page).write_text(h, encoding='utf-8')
    print(page, round(len(h.encode()) / 1e6, 2), 'MB')
