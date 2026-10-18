/* Explorador municipal */
let S, MAC, GEO;
const BOG = '11001';
const SLOT = [
  { c: GOV.cobalt, dash: 'solid' }, { c: GOV.green, dash: 'dash' }, { c: GOV.golden, dash: 'dot' },
  { c: GOV.orange, dash: 'dashdot' }, { c: GOV.matterhorn, dash: 'longdash' }, { c: GOV.havelock, dash: 'longdashdot' }
];
const ex = { ind: 'trib', unit: 'const', dep: '', cat: '', year: 2025, sel: [] };
const IND = {
  trib: { k: 'pc', es: 'Recaudo tributario por habitante', en: 'Tax revenue per inhabitant', units: ['const', 'corr', 'smmlv'], log: true },
  pred: { k: 'pp', es: 'Impuesto predial por habitante', en: 'Property tax per inhabitant', units: ['const', 'corr', 'smmlv'], log: true },
  ica: { k: 'pi', es: 'Industria y comercio por habitante', en: 'Industry and commerce tax per inhabitant', units: ['const', 'corr', 'smmlv'], log: true },
  otros: { k: 'po', es: 'Otros tributos por habitante', en: 'Other taxes per inhabitant', units: ['const', 'corr', 'smmlv'], log: true },
  total: { k: 'tk', es: 'Recaudo tributario total', en: 'Total tax revenue', units: ['const', 'corr'], log: true },
  auto: { k: 'au', es: 'Autonomía tributaria (tributos sobre ingresos totales)', en: 'Tax autonomy (taxes over total revenue)', units: [], log: false },
  pob: { k: 'pob', es: 'Población (DANE)', en: 'Population (DANE)', units: [], log: true }
};
const UNITS = { const: { es: 'COP constantes 2025', en: 'Constant 2025 COP' }, corr: { es: 'COP corrientes', en: 'Current COP' }, smmlv: { es: 'Salarios mínimos', en: 'Minimum wages' } };
function yi(y) { return y - S.anios[0]; }
function val(code, y) {
  const m = S.m[code]; if (!m) return null;
  const i = yi(y), I = IND[ex.ind];
  if (m.al[i] === 1 && ex.ind !== 'pob') return null;
  let v = m[I.k][i];
  if (v === null || v === undefined) return null;
  const f = MAC.factor2025[MAC.anio.indexOf(y)], w = MAC.smmlv[MAC.anio.indexOf(y)];
  if (ex.ind === 'total') return ex.unit === 'corr' ? m.tc[i] : v;
  if (I.units.length) {
    if (ex.unit === 'corr') return v / f;
    if (ex.unit === 'smmlv') return (v / f) / w;
  }
  if (ex.ind === 'auto') return v * 100;
  return v;
}
function unitText() {
  const I = IND[ex.ind];
  if (ex.ind === 'auto') return '%';
  if (ex.ind === 'pob') return T('habitantes', 'inhabitants');
  if (ex.ind === 'total') return ex.unit === 'corr' ? T('millones de COP corrientes', 'millions of current COP') : T('millones de COP constantes de 2025', 'millions of constant 2025 COP');
  return { const: T('COP constantes de 2025 por habitante', 'constant 2025 COP per inhabitant'), corr: T('COP corrientes por habitante', 'current COP per inhabitant'), smmlv: T('salarios mínimos mensuales por habitante', 'monthly minimum wages per inhabitant') }[ex.unit];
}
function fmtV(v) {
  if (v === null) return T('sin dato', 'no data');
  if (ex.ind === 'auto') return fmtNum(v, 1) + ' %';
  if (ex.unit === 'smmlv' && IND[ex.ind].units.length) return fmtNum(v, 3);
  return fmtNum(v, 0);
}
function filtered() {
  return Object.keys(S.m).filter(c => (!ex.dep || c.slice(0, 2) === ex.dep) && (!ex.cat || S.m[c].c === ex.cat));
}
function catName(c) { return c === 'E' ? T('Especial', 'Special') : c ? T('Categoría ', 'Category ') + c : T('Sin categoría', 'No category'); }
function drawMap() {
  const codes = filtered();
  const rows = codes.map(c => [c, val(c, ex.year)]).filter(r => r[1] !== null && (!IND[ex.ind].log || r[1] > 0));
  const lg = IND[ex.ind].log;
  const z = rows.map(r => lg ? Math.log10(r[1]) : r[1]);
  const zs = z.slice().sort((a, b) => a - b);
  const q = p => zs.length ? zs[Math.floor(p * (zs.length - 1))] : 0;
  let ticks = {};
  if (lg && zs.length) {
    const lo = Math.floor(q(0.02)), hi = Math.ceil(q(0.98));
    const tv = []; for (let e = lo; e <= hi; e += 0.5) tv.push(e);
    ticks = { tickvals: tv, ticktext: tv.map(e => fmtNum(Math.pow(10, e), Math.pow(10, e) < 10 ? 2 : 0)) };
  }
  const tr = [{ type: 'choropleth', geojson: GEO, featureidkey: 'id', locations: rows.map(r => r[0]), z,
    zmin: q(0.02), zmax: q(0.98), colorscale: SEQ,
    text: rows.map(r => `${S.m[r[0]].n} (${S.m[r[0]].d})<br>${catName(S.m[r[0]].c)}<br>${fmtV(r[1])}`),
    hovertemplate: '%{text}<extra></extra>', marker: { line: { color: 'rgba(255,255,255,.5)', width: 0.3 } },
    colorbar: { thickness: 12, len: 0.7, ...ticks } }];
  if (codes.includes(BOG)) tr.push({ type: 'choropleth', geojson: GEO, featureidkey: 'id', locations: [BOG], z: [1], showscale: false,
    colorscale: [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0)']], marker: { line: { color: GOV.red, width: 3 } }, hoverinfo: 'skip' });
  ex.sel.forEach(s => { if (codes.includes(s.code)) tr.push({ type: 'choropleth', geojson: GEO, featureidkey: 'id', locations: [s.code], z: [1], showscale: false, colorscale: [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0)']], marker: { line: { color: s.c, width: 2.5 } }, hoverinfo: 'skip' }); });
  plot('ex-map', tr, baseLayout({ margin: { l: 0, r: 0, t: 4, b: 4 }, hovermode: 'closest', geo: { fitbounds: 'locations', visible: false, projection: { type: 'mercator' } } }));
  const el = document.getElementById('ex-map');
  el.removeAllListeners && el.removeAllListeners('plotly_click');
  el.on && el.on('plotly_click', d => { const c = d.points[0].location; if (c) addMun(c); });
  document.getElementById('t-map').textContent = `${T(IND[ex.ind].es, IND[ex.ind].en)}, ${ex.year} (${unitText()})`;
}
function drawTS() {
  const tr = [];
  const codes = filtered();
  const med = S.anios.map(y => { const v = codes.map(c => val(c, y)).filter(x => x !== null).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; });
  const fl = ex.dep || ex.cat ? T('Mediana del filtro', 'Filter median') : T('Mediana nacional', 'National median');
  tr.push({ x: S.anios, y: med, name: fl, type: 'scatter', mode: 'lines', line: { color: GOV.silver, width: 2, dash: 'dash' }, hovertemplate: fl + ': %{y:,.2f}<extra></extra>' });
  ex.sel.forEach(s => tr.push({ x: S.anios, y: S.anios.map(y => val(s.code, y)), name: S.m[s.code].n, type: 'scatter', mode: 'lines', connectgaps: false, line: { color: s.c, dash: s.dash, width: 2.2 }, hovertemplate: S.m[s.code].n + ': %{y:,.2f}<extra></extra>' }));
  tr.push({ x: S.anios, y: S.anios.map(y => val(BOG, y)), name: 'Bogotá D.C.', type: 'scatter', mode: 'lines', line: { color: GOV.red, width: 3.4 }, hovertemplate: 'Bogotá: %{y:,.2f}<extra></extra>' });
  const smm = ex.unit === 'smmlv' && IND[ex.ind].units.length;
  plot('ex-ts', tr, baseLayout({ yaxis: { title: { text: unitText() }, tickformat: smm ? ',.2f' : ',.0f', type: (ex.ind === 'pob' || ex.ind === 'total') ? 'log' : 'linear' },
    xaxis: { dtick: 5, range: [1984.5, 2025.5] }, shapes: [{ type: 'line', x0: ex.year, x1: ex.year, y0: 0, y1: 1, yref: 'paper', line: { color: '#bbb', dash: 'dot' } }], margin: { b: 70 } }));
  document.getElementById('t-ts').textContent = T('Serie 1985 a 2025: Bogotá y municipios seleccionados', 'Series 1985 to 2025: Bogotá and selected municipalities');
  document.getElementById('n-ts').textContent = T('Haga clic en el mapa o use el buscador para agregar municipios. La escala es logarítmica para población y recaudo total.', 'Click on the map or use the search box to add municipalities. The scale is logarithmic for population and total revenue.');
}
function drawRank() {
  const codes = filtered();
  const rows = codes.map(c => ({ c, v: val(c, ex.year) })).filter(r => r.v !== null).sort((a, b) => b.v - a.v);
  const t = document.getElementById('tbl-rank');
  let h = `<thead><tr><th>#</th><th>${T('Municipio', 'Municipality')}</th><th>${T('Departamento', 'Department')}</th><th>${T('Categoría 2025', '2025 category')}</th><th>${unitText()}</th><th>${T('Población', 'Population')}</th><th></th></tr></thead><tbody>`;
  rows.slice(0, 400).forEach((r, i) => {
    const m = S.m[r.c];
    h += `<tr class="${r.c === BOG ? 'bog' : ''}"><td>${i + 1}</td><td>${m.n}</td><td>${m.d}</td><td>${catName(m.c)}</td><td>${fmtV(r.v)}</td><td>${fmtNum(m.pob[yi(ex.year)])}</td><td>${r.c === BOG ? '' : `<button type="button" data-c="${r.c}">${T('Comparar', 'Compare')}</button>`}</td></tr>`;
  });
  t.innerHTML = h + '</tbody>';
  t.querySelectorAll('button[data-c]').forEach(b => b.onclick = () => addMun(b.dataset.c));
  document.getElementById('t-rank').textContent = `${T('Ordenamiento', 'Ranking')} ${ex.year}: ${rows.length} ${T('municipios con dato', 'municipalities with data')}${rows.length > 400 ? T(' (se muestran 400)', ' (400 shown)') : ''}`;
}
function drawChips() {
  const box = document.getElementById('chips');
  box.innerHTML = `<span class="chip fixed"><i style="background:${GOV.red}"></i>Bogotá D.C.</span>` + ex.sel.map(s => `<span class="chip"><i style="background:${s.c}"></i>${S.m[s.code].n}<button type="button" aria-label="quitar" data-c="${s.code}">×</button></span>`).join('');
  box.querySelectorAll('button[data-c]').forEach(b => b.onclick = () => { ex.sel = ex.sel.filter(s => s.code !== b.dataset.c); drawAllEx(); });
}
function addMun(code) {
  if (!S.m[code] || code === BOG || ex.sel.find(s => s.code === code)) return;
  if (ex.sel.length >= 6) ex.sel.shift();
  const used = ex.sel.map(s => s.c);
  const slot = SLOT.find(s => !used.includes(s.c)) || SLOT[0];
  ex.sel.push({ code, ...slot });
  drawAllEx();
}
function unitSeg() {
  const I = IND[ex.ind];
  const box = document.getElementById('seg-unit');
  if (!I.units.length) { box.innerHTML = `<span class="note">${T('No aplica', 'Not applicable')}</span>`; box.classList.remove('seg'); return; }
  if (!I.units.includes(ex.unit)) ex.unit = 'const';
  segmented('seg-unit', I.units.map(u => ({ v: u, ...UNITS[u] })), ex.unit, v => { ex.unit = v; drawAllEx(); });
}
function fillSelects() {
  const si = document.getElementById('sel-ind');
  si.innerHTML = Object.entries(IND).map(([k, v]) => `<option value="${k}" ${k === ex.ind ? 'selected' : ''}>${T(v.es, v.en)}</option>`).join('');
  const deps = {}; Object.entries(S.m).forEach(([c, m]) => { deps[c.slice(0, 2)] = m.d || deps[c.slice(0, 2)]; });
  const sd = document.getElementById('sel-dep');
  sd.innerHTML = `<option value="">${T('Todos', 'All')}</option>` + Object.entries(deps).sort((a, b) => a[1].localeCompare(b[1])).map(([k, v]) => `<option value="${k}" ${k === ex.dep ? 'selected' : ''}>${v}</option>`).join('');
  const sc = document.getElementById('sel-cat');
  sc.innerHTML = `<option value="">${T('Todas', 'All')}</option>` + ['E', '1', '2', '3', '4', '5', '6'].map(c => `<option value="${c}" ${c === ex.cat ? 'selected' : ''}>${catName(c)}</option>`).join('');
  const dl = document.getElementById('dl-mun');
  dl.innerHTML = Object.entries(S.m).map(([c, m]) => `<option value="${m.n} (${m.d}) ${c}"></option>`).join('');
  document.getElementById('inp-mun').placeholder = T('Escriba un nombre, por ejemplo Pasto', 'Type a name, for example Pasto');
}
function drawAllEx() { unitSeg(); drawChips(); drawMap(); drawTS(); drawRank(); }
function downloadCSV() {
  const codes = filtered();
  const head = ['codigo', 'municipio', 'departamento', 'categoria2025', 'anio', 'categoriaAnual', 'poblacion', 'tributariosMillonesCOPcorrientes', 'tributariosMillonesCOP2025', 'pcTributariosCOP2025', 'pcPredialCOP2025', 'pcIcaCOP2025', 'pcOtrosCOP2025', 'tributariosSMMLVporHabitante', 'autonomiaTributaria', 'alertaCalidad'];
  const lines = [head.join(',')];
  codes.forEach(c => { const m = S.m[c]; S.anios.forEach((y, i) => {
    const r = [c, '"' + m.n + '"', '"' + m.d + '"', m.c ?? '', y, m.cat[i] ?? '', m.pob[i] ?? '', m.tc[i] ?? '', m.tk[i] ?? '', m.pc[i] ?? '', m.pp[i] ?? '', m.pi[i] ?? '', m.po[i] ?? '', m.sm[i] ?? '', m.au[i] ?? '', m.al[i] ?? ''];
    lines.push(r.join(','));
  }); });
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'seleccionCargaTributaria.csv'; a.click();
}
document.addEventListener('DOMContentLoaded', async () => {
  let R;
  [S, R, GEO] = await Promise.all([getJSON('assets/data/series.json'), getJSON('assets/data/resultados.json'), getJSON('assets/data/geo/municipios.geojson')]);
  MAC = R.macro;
  try { const q = new URLSearchParams(location.search); if (q.get('m')) q.get('m').split(',').forEach(addMunSilent); } catch (e) {}
  ['08001', '05001', '76001'].forEach(addMunSilent);
  fillSelects();
  document.getElementById('sel-ind').onchange = e => { ex.ind = e.target.value; drawAllEx(); };
  document.getElementById('sel-dep').onchange = e => { ex.dep = e.target.value; drawAllEx(); };
  document.getElementById('sel-cat').onchange = e => { ex.cat = e.target.value; drawAllEx(); };
  const rg = document.getElementById('rng-year');
  rg.oninput = e => { ex.year = +e.target.value; document.getElementById('lbl-year').textContent = ex.year; drawMap(); drawRank(); drawTS(); };
  const inp = document.getElementById('inp-mun');
  inp.onchange = () => { const m = inp.value.match(/(\d{5})\s*$/); if (m) addMun(m[1]); inp.value = ''; };
  document.getElementById('btn-dl').onclick = downloadCSV;
  drawAllEx();
  REDRAW.push(() => { fillSelects(); drawAllEx(); });
});
function addMunSilent(code) {
  if (!S || !S.m[code] || code === BOG || ex.sel.find(s => s.code === code) || ex.sel.length >= 6) return;
  const used = ex.sel.map(s => s.c); const slot = SLOT.find(s => !used.includes(s.c));
  ex.sel.push({ code, ...slot });
}
