/* Figuras dinámicas del documento */
let RES, ECO, GEO_M, GEO_D;
const CIUDADES = ['Bogotá', 'Barranquilla', 'Medellín', 'Cali', 'Cartagena', 'Bucaramanga'];
const GORDER = ['Bogotá D.C.', 'Especial (sin Bogotá)', 'Categoría 1', 'Categoría 2', 'Categoría 3', 'Categoría 4', 'Categoría 5', 'Categoría 6'];
const st = { ciudUnidad: 'const', totUnidad: 'const', grupoUnidad: 'const', grupoEscala: 'log', depImp: 'presion', munVar: 'pc' };

function unitLabel(u) {
  return { const: T('COP constantes de 2025 por habitante', 'Constant 2025 COP per inhabitant'),
           corr: T('COP corrientes por habitante', 'Current COP per inhabitant'),
           smmlv: T('Salarios mínimos mensuales por habitante', 'Monthly minimum wages per inhabitant'),
           mediana: T('Mediana municipal, COP constantes de 2025', 'Municipal median, constant 2025 COP') }[u];
}
function lastLabel(x, y, text, color) {
  return { x, y, text, showarrow: false, xanchor: 'left', xshift: 6, font: { size: 11.5, color: '#222' }, bgcolor: 'rgba(255,255,255,.75)' };
}
function cityVals(c, imp, u) {
  const d = RES.especiales[c];
  const key = { total: 'pcTributarios2025', predial: 'pcPredial2025', ica: 'pcIca2025' }[imp];
  const sk = { total: 'tributariosSMMLVpc', predial: 'predialSMMLVpc', ica: 'icaSMMLVpc' }[imp];
  return d.anio.map((a, i) => {
    const v = d[key][i];
    if (v === null) return null;
    if (u === 'const') return v;
    if (u === 'corr') return v / d.factor2025[i];
    return d[sk][i];
  });
}
function figCiudades(div, imp, u) {
  const traces = [], ann = [];
  CIUDADES.slice().reverse().forEach(c => {
    const y = cityVals(c, imp, u), s = CIUDAD[c], x = RES.especiales[c].anio;
    traces.push({ x, y, name: c, type: 'scatter', mode: 'lines', line: { color: s.c, width: s.w, dash: s.dash },
      hovertemplate: c + ': %{y:' + (u === 'smmlv' ? ',.3f' : ',.0f') + '}<extra></extra>' });
  });
  const tf = u === 'smmlv' ? ',.2f' : ',.0f';
  plot(div, traces, baseLayout({ yaxis: { title: { text: unitLabel(u), font: { size: 12 } }, tickformat: tf, rangemode: 'tozero' },
    xaxis: { range: [1984.5, 2025.5], dtick: 5 }, legend: { traceorder: 'reversed' }, margin: { l: 78, r: 16, t: 34, b: 60 },
    title: { text: { total: T('Total tributario', 'Total tax revenue'), predial: T('Impuesto predial', 'Property tax'), ica: T('Industria y comercio (ICA)', 'Industry and commerce tax (ICA)') }[imp], x: 0.01, font: { size: 14 } } }));
}
function drawCiudades() {
  figCiudades('f-predial', 'predial', st.ciudUnidad);
  figCiudades('f-ica', 'ica', st.ciudUnidad);
  figCiudades('f-total', 'total', st.ciudUnidad);
}
function drawNacional() {
  const n = RES.nacional;
  const tr = [
    { x: n.anio, y: n.presionNacional.map(v => v * 100), name: T('Total tributos municipales', 'Total municipal taxes'), line: { color: GOV.cobalt, width: 3 } },
    { x: n.anio, y: n.icaPIB.map(v => v * 100), name: T('Industria y comercio', 'Industry and commerce'), line: { color: GOV.golden, width: 2, dash: 'dash' } },
    { x: n.anio, y: n.predialPIB.map(v => v * 100), name: T('Predial', 'Property tax'), line: { color: GOV.green, width: 2, dash: 'dot' } }
  ].map(t => ({ ...t, type: 'scatter', mode: 'lines', hovertemplate: t.name + ': %{y:.2f} %<extra></extra>' }));
  plot('f-nacional', tr, baseLayout({ yaxis: { title: { text: T('Porcentaje del PIB', 'Percent of GDP') }, tickformat: '.1f', ticksuffix: ' %', rangemode: 'tozero' }, xaxis: { dtick: 5 } }));
  plot('f-bogshare', [{ x: n.anio, y: n.participacionBogota.map(v => v * 100), type: 'scatter', mode: 'lines', name: T('Bogotá', 'Bogotá'),
    line: { color: GOV.red, width: 3 }, hovertemplate: T('Participación de Bogotá', 'Bogotá share') + ': %{y:.1f} %<extra></extra>' }],
    baseLayout({ showlegend: false, yaxis: { title: { text: T('% del recaudo municipal del país', '% of national municipal revenue') }, ticksuffix: ' %', tickformat: '.0f', range: [0, 50] }, xaxis: { dtick: 5 } }));
}
function drawGrupos() {
  const u = st.grupoUnidad;
  const key = { const: 'pcTrib', mediana: 'medianaPc', smmlv: 'smmlvPc' }[u];
  const tr = GORDER.slice().reverse().map(g => {
    const d = RES.grupos[g], s = GRUPO[g];
    return { x: d.anio, y: d[key], name: s[LANG], type: 'scatter', mode: 'lines', line: { color: s.c, width: s.w, dash: s.dash },
      hovertemplate: s[LANG] + ': %{y:' + (u === 'smmlv' ? ',.3f' : ',.0f') + '}<extra></extra>' };
  });
  const lv = u === 'smmlv' ? [0.02, 0.05, 0.1, 0.2, 0.5, 1, 2] : [10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000];
  const yl = st.grupoEscala === 'log' ? { tickvals: lv, ticktext: lv.map(v => fmtNum(v, u === 'smmlv' ? 2 : 0)) } : {};
  plot('f-grupos', tr, baseLayout({ yaxis: { type: st.grupoEscala, title: { text: unitLabel(u) }, tickformat: u === 'smmlv' ? ',.2f' : ',.0f', ...yl },
    xaxis: { dtick: 5, range: [1984.5, 2025.5] }, legend: { traceorder: 'reversed', y: -0.16 }, margin: { b: 92 } }));
}
function drawAutonomia() {
  const years = [1985, 2000, 2025];
  const blues = [GOV.tropical, GOV.havelock, '#062f80'];
  const reds = ['#e7a3ae', '#d0485f', GOV.red];
  const tr = years.map((y, j) => ({
    type: 'bar', name: String(y),
    x: GORDER.map(g => GRUPO[g][LANG]),
    y: GORDER.map(g => { const d = RES.grupos[g]; const i = d.anio.indexOf(y); return i < 0 ? null : d.autonomia[i] * 100; }),
    marker: { color: GORDER.map(g => g === 'Bogotá D.C.' ? reds[j] : blues[j]), line: { color: '#fff', width: 1.5 } },
    hovertemplate: '%{x}, ' + y + ': %{y:.1f} %<extra></extra>'
  }));
  plot('f-autonomia', tr, baseLayout({ barmode: 'group', bargap: 0.25, hovermode: 'closest', yaxis: { title: { text: T('Autonomía tributaria (%)', 'Tax autonomy (%)') }, ticksuffix: ' %', tickformat: '.0f' },
    xaxis: { tickangle: -25 }, margin: { b: 110 }, legend: { y: -0.36 } }));
}
function drawDispersion() {
  const d = RES.dispersion;
  plot('f-gini', [{ x: d.anio, y: d.gini, type: 'scatter', mode: 'lines', line: { color: GOV.cobalt, width: 2.6 }, name: 'Gini',
    hovertemplate: 'Gini: %{y:.3f}<extra></extra>' }],
    baseLayout({ showlegend: false, yaxis: { title: { text: T('Gini ponderado por población', 'Population weighted Gini') }, tickformat: '.2f', range: [0.3, 0.65] }, xaxis: { dtick: 5 } }));
  const pts = ECO.convergencia.puntos;
  const cats = ['E', '1', '2', '3', '4', '5', '6'];
  const col = { E: '#062f80', 1: GOV.cobalt, 2: GOV.havelock, 3: GOV.portage, 4: GOV.golden, 5: GOV.green, 6: GOV.silver };
  const tr = cats.map(c => {
    const q = pts.filter(p => p.cat === c && p.codigo !== '11001');
    return { type: 'scattergl', mode: 'markers', name: c === 'E' ? T('Especial', 'Special') : T('Categoría ', 'Category ') + c,
      x: q.map(p => Math.exp(p.l0)), y: q.map(p => p.g * 100), text: q.map(p => (MUNNAME[p.codigo] || p.codigo)),
      marker: { color: col[c], size: c === '6' ? 5 : 8, opacity: c === '6' ? 0.55 : 0.9, line: { color: '#fff', width: 0.6 } },
      hovertemplate: '%{text}<br>' + T('Nivel inicial', 'Initial level') + ': COP %{x:,.0f}<br>' + T('Crecimiento anual', 'Annual growth') + ': %{y:.1f} %<extra></extra>' };
  });
  const b = pts.find(p => p.codigo === '11001');
  if (b) tr.push({ type: 'scatter', mode: 'markers+text', name: 'Bogotá', x: [Math.exp(b.l0)], y: [b.g * 100], text: ['Bogotá'], textposition: 'top center',
    marker: { color: GOV.red, size: 14, line: { color: '#fff', width: 2 } }, textfont: { color: GOV.red, size: 13 }, hovertemplate: 'Bogotá: %{y:.1f} %<extra></extra>' });
  plot('f-conv', tr, baseLayout({ hovermode: 'closest', xaxis: { type: 'log', title: { text: T('Nivel 2004 a 2006, COP 2025 por habitante', 'Level 2004 to 2006, COP 2025 per capita') }, tickvals: [3000, 10000, 30000, 100000, 300000, 1000000], ticktext: ['3 mil', '10 mil', '30 mil', '100 mil', '300 mil', '1 millón'].map(t => LANG === 'en' ? t.replace(' mil', 'k').replace('1 millón', '1M') : t), showgrid: true, gridcolor: '#f0f0f0' },
    yaxis: { title: { text: T('Crecimiento real anual (%)', 'Annual real growth (%)') }, tickformat: '.0f', ticksuffix: ' %', range: [-8, 20] }, margin: { b: 120 }, legend: { y: -0.3 } }));
}
function geoLayout(extra = {}) {
  return baseLayout(deepMerge({ margin: { l: 0, r: 0, t: 6, b: 6 }, hovermode: 'closest',
    geo: { fitbounds: 'locations', visible: false, projection: { type: 'mercator' }, bgcolor: '#fff' } }, extra));
}
function drawMapDep() {
  const d = RES.presionDepUltimo;
  const k = st.depImp;
  const ids = d.map(x => x.codDepto);
  const vals = d.map(x => x[k] * 100);
  const tr = [{ type: 'choropleth', geojson: GEO_D, featureidkey: 'properties.DPTO_CCDGO', locations: ids, z: vals,
    text: d.map(x => x.depto), colorscale: SEQ, marker: { line: { color: '#fff', width: 0.8 } },
    colorbar: { title: { text: T('% del PIB', '% of GDP'), side: 'right' }, ticksuffix: ' %', thickness: 12, len: 0.7, tickformat: '.1f' },
    hovertemplate: '%{text}: %{z:.2f} %<extra></extra>' }];
  const bi = ids.indexOf('11');
  if (bi >= 0) tr.push({ type: 'choropleth', geojson: GEO_D, featureidkey: 'properties.DPTO_CCDGO', locations: ['11'], z: [1], showscale: false,
    colorscale: [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0)']], marker: { line: { color: GOV.red, width: 3 } }, hoverinfo: 'skip' });
  plot('f-mapdep', tr, geoLayout());
}
function drawPresion() {
  const P = RES.presionDepartamental;
  const sel = [['Bogotá D.C.', GOV.red, 'solid', 3.4], ['Atlántico', GOV.cobalt, 'solid', 2], ['Antioquia', GOV.green, 'dash', 2], ['Valle del Cauca', GOV.golden, 'dot', 2.2], ['Bolívar', GOV.orange, 'dashdot', 2]];
  const tr = sel.slice().reverse().map(([n, c, ds, w]) => ({ x: P[n].anio, y: P[n].presion.map(v => v * 100), name: n, type: 'scatter', mode: 'lines', line: { color: c, dash: ds, width: w }, hovertemplate: n + ': %{y:.2f} %<extra></extra>' }));
  const N = RES.nacional;
  tr.unshift({ x: N.anio, y: N.presionNacional.map(v => v * 100), name: T('Colombia (total municipal)', 'Colombia (all municipalities)'), type: 'scatter', mode: 'lines', line: { color: GOV.grey, width: 2, dash: 'longdash' }, hovertemplate: 'Colombia: %{y:.2f} %<extra></extra>' });
  plot('f-presion', tr, baseLayout({ yaxis: { title: { text: T('% del PIB departamental', '% of departmental GDP') }, ticksuffix: ' %', tickformat: '.1f', rangemode: 'tozero' }, xaxis: { dtick: 5 }, legend: { traceorder: 'reversed' }, margin: { b: 80 } }));
}
let MUNNAME = {};
function drawMapMun() {
  const k = st.munVar;
  let rows = RES.mapa.map(r => ({ ...r }));
  const ef = {}; ECO.esfuerzo.forEach(e => { ef[e.codigo] = e.esfuerzo; });
  rows.forEach(r => { r.esf = ef[r.codigo] ?? null; });
  const cfg = {
    pc: { f: r => r.pc > 0 ? Math.log10(r.pc) : null, tick: true, title: T('COP 2025', 'COP 2025'), hv: r => fmtCOP(r.pc) },
    smmlv: { f: r => r.smmlv, title: 'SMMLV', hv: r => fmtNum(r.smmlv, 3) + ' ' + T('salarios mínimos', 'minimum wages') },
    autonomia: { f: r => r.autonomia === null ? null : r.autonomia * 100, title: '%', hv: r => fmtPct(r.autonomia) },
    crec: { f: r => r.crec === null ? null : Math.max(-5, Math.min(15, r.crec * 100)), title: T('% anual', '% per year'), hv: r => fmtPct(r.crec) },
    esf: { f: r => r.esf === null ? null : Math.max(0.3, Math.min(2, r.esf)), title: T('índice', 'index'), hv: r => r.esf === null ? T('sin dato', 'no data') : fmtNum(r.esf, 2), div: true }
  }[k];
  rows = rows.filter(r => cfg.f(r) !== null && isFinite(cfg.f(r)));
  const z = rows.map(cfg.f);
  const tr = [{ type: 'choropleth', geojson: GEO_M, featureidkey: 'id', locations: rows.map(r => r.codigo), z,
    text: rows.map(r => `${r.municipio} (${r.departamento})<br>${T('Categoría', 'Category')} ${r.categoria === 'E' ? T('especial', 'special') : (r.categoria ?? T('sin categoría', 'none'))}<br>${cfg.hv(r)}`),
    colorscale: cfg.div ? [[0, GOV.golden], [0.41, '#f2ead0'], [0.41, '#eef2fa'], [1, '#062f80']] : SEQ,
    zmin: cfg.div ? 0.3 : undefined, zmax: cfg.div ? 2 : undefined,
    marker: { line: { color: 'rgba(255,255,255,0.5)', width: 0.3 } },
    colorbar: { title: { text: cfg.title }, thickness: 12, len: 0.7,
      ...(cfg.tick ? { tickvals: [4.5, 5, 5.5, 6, 6.5], ticktext: ['31.623', '100.000', '316.228', '1.000.000', '3.162.278'].map(s => LANG === 'en' ? s.replace(/\./g, ',') : s) } : {}) },
    hovertemplate: '%{text}<extra></extra>' }];
  tr.push({ type: 'choropleth', geojson: GEO_M, featureidkey: 'id', locations: ['11001'], z: [1], showscale: false,
    colorscale: [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0)']], marker: { line: { color: GOV.red, width: 3 } }, hoverinfo: 'skip' });
  plot('f-mapmun', tr, geoLayout());
}
function drawCiclo() {
  const vs = [['dlpc', T('Total', 'Total'), GOV.cobalt], ['dlpred', T('Predial', 'Property'), GOV.green], ['dlica', 'ICA', GOV.golden], ['dlotr', T('Otros tributos', 'Other taxes'), GOV.matterhorn]];
  const tr = vs.map(([v, n, c], j) => {
    const A = ECO.ciclo[v].todos.A;
    const ks = ['2', '3', '4'];
    return { type: 'scatter', mode: 'markers', name: n, x: ks.map(k => T('Año ', 'Year ') + k), y: ks.map(k => A[k][0] * 100),
      error_y: { type: 'data', array: ks.map(k => 1.96 * A[k][1] * 100), color: c, thickness: 1.6, width: 5 },
      marker: { color: c, size: 10, symbol: ['circle', 'square', 'diamond', 'triangle-up'][j] }, offsetgroup: j,
      hovertemplate: n + ', %{x}: %{y:.1f}<extra></extra>' };
  });
  plot('f-ciclo', tr, baseLayout({ scattermode: 'group', scattergap: 0.5, hovermode: 'closest', yaxis: { title: { text: T('Diferencia frente al año 1 (log × 100)', 'Difference with year 1 (log × 100)') }, zeroline: true, zerolinecolor: '#888', tickformat: '.0f' } }));
  const M = ECO.medianasCrecimiento;
  const first = M.anio.map(a => ((a - 2004) % 4) === 0);
  plot('f-medianas', [{ type: 'bar', x: M.anio, y: M.dlotr.map(v => v * 100), name: T('Otros tributos', 'Other taxes'),
    marker: { color: first.map(f => f ? GOV.golden : GOV.havelock), line: { color: '#fff', width: 1 } }, hovertemplate: '%{x}: %{y:.1f} %<extra></extra>' }],
    baseLayout({ showlegend: false, hovermode: 'closest', yaxis: { title: { text: T('Mediana del crecimiento real (%)', 'Median real growth (%)') }, ticksuffix: ' %', tickformat: '.0f', zeroline: true, zerolinecolor: '#888' }, xaxis: { dtick: 2, tickangle: -45 } }));
}
function drawSint() {
  const S = ECO.sintetico;
  plot('f-sint', [
    { x: S.anios, y: S.real.map(Math.exp), name: 'Barranquilla', type: 'scatter', mode: 'lines', line: { color: GOV.cobalt, width: 3 }, hovertemplate: 'Barranquilla: COP %{y:,.0f}<extra></extra>' },
    { x: S.anios, y: S.sint.map(Math.exp), name: T('Barranquilla sintética', 'Synthetic Barranquilla'), type: 'scatter', mode: 'lines', line: { color: GOV.matterhorn, width: 2, dash: 'dash' }, hovertemplate: T('Sintética', 'Synthetic') + ': COP %{y:,.0f}<extra></extra>' }
  ], baseLayout({ xaxis: { range: [1999.5, 2025.5], dtick: 5 }, yaxis: { title: { text: T('COP constantes de 2025 por habitante', 'Constant 2025 COP per inhabitant') }, tickformat: ',.0f', rangemode: 'tozero' },
    shapes: [{ type: 'line', x0: 2007.5, x1: 2007.5, y0: 0, y1: 1, yref: 'paper', line: { color: '#999', dash: 'dot' } }],
    annotations: [{ x: 2007.6, y: 1, yref: 'paper', text: T('2008: nuevo estatuto y fin de concesiones', '2008: new statute, concessions end'), showarrow: false, xanchor: 'left', yanchor: 'top', font: { size: 11, color: '#555' } }] }));
  const tr = S.placebos.map(p => ({ x: S.anios, y: p.gap, type: 'scatter', mode: 'lines', line: { color: '#cfcfcf', width: 1 }, name: p.municipio, showlegend: false, hovertemplate: p.municipio + ': %{y:.2f}<extra></extra>' }));
  tr.push({ x: S.anios, y: S.gap, type: 'scatter', mode: 'lines', line: { color: GOV.cobalt, width: 3 }, name: 'Barranquilla', hovertemplate: 'Barranquilla: %{y:.2f}<extra></extra>' });
  plot('f-placebo', tr, baseLayout({ hovermode: 'closest', showlegend: false, xaxis: { range: [1999.5, 2025.5], dtick: 5 }, yaxis: { title: { text: T('Brecha frente al sintético (log)', 'Gap with synthetic (log)') }, tickformat: '.1f', zeroline: true, zerolinecolor: '#888' },
    shapes: [{ type: 'line', x0: 2007.5, x1: 2007.5, y0: 0, y1: 1, yref: 'paper', line: { color: '#999', dash: 'dot' } }] }));
}
function drawCrec() {
  const g = ECO.crecimientoGrandes.slice().sort((a, b) => a.crec - b.crec);
  plot('f-crec', [{ type: 'bar', orientation: 'h', y: g.map(r => r.municipio.replace(', D.C.', '').replace(' de Indias', '')), x: g.map(r => r.crec * 100),
    marker: { color: g.map(r => r.codigo === '11001' ? GOV.red : (r.codigo === '08001' ? GOV.cobalt : GOV.portage)), line: { color: '#fff', width: 1 } },
    customdata: g.map(r => [r.pc0, r.pc1]),
    hovertemplate: '%{y}: %{x:.1f} %<br>2004 a 2006: COP %{customdata[0]:,.0f}<br>2023 a 2025: COP %{customdata[1]:,.0f}<extra></extra>' }],
    baseLayout({ hovermode: 'closest', showlegend: false, margin: { l: 150, t: 8 }, xaxis: { title: { text: T('Crecimiento real anual del recaudo per cápita (%)', 'Annual real growth of per capita revenue (%)') }, ticksuffix: ' %', showgrid: true, gridcolor: '#eee' }, yaxis: { automargin: true, tickfont: { size: 11.5 } } }));
}
function drawML() {
  const im = ECO.ml.importancia.slice().reverse();
  const en = { 'Departamento': 'Department', 'Valor agregado por habitante (log)': 'Value added per inhabitant (log)', 'Categoría municipal': 'Municipal category', 'Año': 'Year', 'Población (log)': 'Population (log)', 'Participación urbana': 'Urban share', 'Transferencias por habitante, rezago (log)': 'Transfers per inhabitant, lagged (log)', 'Regalías por habitante, rezago (log)': 'Royalties per inhabitant, lagged (log)' };
  plot('f-imp', [{ type: 'bar', orientation: 'h', y: im.map(r => LANG === 'en' ? en[r.variable] : r.variable), x: im.map(r => r.valor),
    marker: { color: GOV.havelock, line: { color: '#fff', width: 1 } }, hovertemplate: '%{y}: %{x:.3f}<extra></extra>' }],
    baseLayout({ hovermode: 'closest', showlegend: false, margin: { l: 250, t: 8 }, xaxis: { title: { text: T('Pérdida de R² al permutar la variable', 'R² loss when the variable is permuted') }, tickformat: '.2f', showgrid: true, gridcolor: '#eee' } }));
  const E = ECO.esfuerzo;
  const cats = ['E', '1', '2', '3', '4', '5', '6'];
  const col = { E: '#062f80', 1: GOV.cobalt, 2: GOV.havelock, 3: GOV.portage, 4: GOV.golden, 5: GOV.green, 6: GOV.silver };
  const tr = cats.map(c => {
    const q = E.filter(e => e.cat === c && e.codigo !== '11001');
    return { type: 'scattergl', mode: 'markers', name: c === 'E' ? T('Especial', 'Special') : T('Categoría ', 'Category ') + c, x: q.map(e => e.pcPred), y: q.map(e => e.pc), text: q.map(e => e.municipio),
      customdata: q.map(e => e.esfuerzo), marker: { color: col[c], size: c === '6' ? 5 : 8, opacity: c === '6' ? 0.5 : 0.9, line: { color: '#fff', width: 0.5 } },
      hovertemplate: '%{text}<br>' + T('Observado', 'Observed') + ': COP %{y:,.0f}<br>' + T('Predicho', 'Predicted') + ': COP %{x:,.0f}<br>' + T('Índice', 'Index') + ': %{customdata:.2f}<extra></extra>' };
  });
  const b = E.find(e => e.codigo === '11001');
  if (b) tr.push({ type: 'scatter', mode: 'markers+text', name: 'Bogotá', x: [b.pcPred], y: [b.pc], text: ['Bogotá'], textposition: 'middle left', marker: { color: GOV.red, size: 14, line: { color: '#fff', width: 2 } }, textfont: { color: GOV.red, size: 13 }, hovertemplate: 'Bogotá<br>' + T('Índice', 'Index') + ': ' + b.esfuerzo.toFixed(2) + '<extra></extra>' });
  tr.push({ type: 'scatter', mode: 'lines', x: [3e4, 4e6], y: [3e4, 4e6], line: { color: '#888', dash: 'dot', width: 1 }, name: T('Observado = predicho', 'Observed = predicted'), hoverinfo: 'skip' });
  plot('f-esfuerzo', tr, baseLayout({ hovermode: 'closest', xaxis: { type: 'log', title: { text: T('Predicho fuera de muestra, COP 2025', 'Out of sample predicted, COP 2025') }, tickvals: [30000, 100000, 300000, 1000000, 3000000], ticktext: ['30 mil', '100 mil', '300 mil', '1 millón', '3 millones'].map(t => LANG === 'en' ? t.replace(' mil', 'k').replace(' millones', 'M').replace('1 millón', '1M') : t), showgrid: true, gridcolor: '#f0f0f0' },
    yaxis: { type: 'log', title: { text: T('Observado, COP 2025', 'Observed, COP 2025') }, tickvals: [30000, 100000, 300000, 1000000, 3000000], ticktext: ['30 mil', '100 mil', '300 mil', '1 millón', '3 millones'].map(t => LANG === 'en' ? t.replace(' mil', 'k').replace(' millones', 'M').replace('1 millón', '1M') : t) }, margin: { b: 120 }, legend: { y: -0.3 } }));
  const B = ECO.brecha.slice().sort((a, b) => (a.cat === 'E' ? -1 : b.cat === 'E' ? 1 : a.cat.localeCompare(b.cat)));
  plot('f-brecha', [{ type: 'bar', x: B.map(r => r.cat === 'E' ? T('Especial', 'Special') : T('Cat. ', 'Cat. ') + r.cat), y: B.map(r => r.brecha / r.recaudo * 100),
    customdata: B.map(r => [r.brecha / 1e9, r.nBajo, r.n]), marker: { color: GOV.havelock, line: { color: '#fff', width: 1 } },
    hovertemplate: '%{x}: %{y:.1f} %<br>' + T('Brecha', 'Gap') + ': COP %{customdata[0]:,.0f} ' + T('mil millones', 'billion') + '<br>' + T('Municipios bajo el predicho', 'Municipalities below prediction') + ': %{customdata[1]} / %{customdata[2]}<extra></extra>' }],
    baseLayout({ hovermode: 'closest', showlegend: false, yaxis: { title: { text: T('Brecha como % del recaudo observado', 'Gap as % of observed revenue') }, ticksuffix: ' %', tickformat: '.0f' } }));
}
function tablas() {
  const t1 = document.getElementById('t-grupos');
  if (t1) {
    const yrs = [1985, 2000, 2025];
    let h = `<thead><tr><th>${T('Grupo', 'Group')}</th>` + yrs.map(y => `<th>${y}<br><span class="note">COP 2025</span></th>`).join('') + yrs.map(y => `<th>${y}<br><span class="note">SMMLV</span></th>`).join('') + `<th>${T('Autonomía 2025', 'Autonomy 2025')}</th><th>${T('Municipios', 'Municipalities')}</th></tr></thead><tbody>`;
    GORDER.forEach(g => {
      const d = RES.grupos[g];
      const v = (y, k) => { const i = d.anio.indexOf(y); return i < 0 ? null : d[k][i]; };
      h += `<tr class="${g === 'Bogotá D.C.' ? 'bog' : ''}"><td>${GRUPO[g][LANG]}</td>` + yrs.map(y => `<td>${fmtNum(v(y, 'pcTrib'))}</td>`).join('') + yrs.map(y => `<td>${fmtNum(v(y, 'smmlvPc'), 3)}</td>`).join('') + `<td>${fmtPct(v(2025, 'autonomia'))}</td><td>${fmtNum(v(2025, 'n'))}</td></tr>`;
    });
    t1.innerHTML = h + '</tbody>';
  }
  const t2 = document.getElementById('t-fe');
  if (t2) {
    const F = ECO.efectosFijos;
    const lab = { lva: T('Valor agregado por habitante (log)', 'Value added per inhabitant (log)'), lpob: T('Población (log)', 'Population (log)'), participacionUrbana: T('Participación urbana', 'Urban share'), ltr: T('Transferencias por habitante, rezago (log)', 'Transfers per inhabitant, lagged (log)') };
    const star = p => p < 0.01 ? '***' : p < 0.05 ? '**' : p < 0.1 ? '*' : '';
    let h = `<thead><tr><th>${T('Variable', 'Variable')}</th><th>(1)</th><th>(2)</th></tr></thead><tbody>`;
    Object.keys(lab).forEach(k => {
      const a = F.m3[k], b = F.m4[k];
      h += `<tr><td>${lab[k]}</td><td>${a ? fmtNum(a[0], 3) + star(a[2]) + '<br><span class="note">(' + fmtNum(a[1], 3) + ')</span>' : ''}</td><td>${b ? fmtNum(b[0], 3) + star(b[2]) + '<br><span class="note">(' + fmtNum(b[1], 3) + ')</span>' : ''}</td></tr>`;
    });
    h += `<tr><td>${T('Efectos fijos de municipio y de año', 'Municipality and year fixed effects')}</td><td>${T('Sí', 'Yes')}</td><td>${T('Sí', 'Yes')}</td></tr><tr><td>${T('Observaciones', 'Observations')}</td><td>${fmtNum(F.n3)}</td><td>${fmtNum(F.n4)}</td></tr>`;
    t2.innerHTML = h + '</tbody>';
  }
  const t3 = document.getElementById('t-pesos');
  if (t3) {
    const S = ECO.sintetico;
    t3.innerHTML = `<thead><tr><th>${T('Municipio donante', 'Donor municipality')}</th><th>${T('Peso', 'Weight')}</th></tr></thead><tbody>` +
      Object.entries(S.pesos).map(([k, v]) => `<tr><td>${k}</td><td>${fmtNum(v, 3)}</td></tr>`).join('') + '</tbody>';
  }
}
function drawAll() {
  drawNacional(); drawCiudades(); drawGrupos(); drawAutonomia(); drawDispersion(); drawMapDep(); drawPresion(); drawMapMun(); drawCiclo(); drawSint(); drawCrec(); drawML(); tablas();
}
function tocSpy() {
  const links = [...document.querySelectorAll('.toc a[href^="#"]')];
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const obs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { links.forEach(l => l.classList.remove('active')); const a = map.get(e.target.id); if (a) a.classList.add('active'); } });
  }, { rootMargin: '-70px 0px -75% 0px' });
  map.forEach((a, id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
}
document.addEventListener('DOMContentLoaded', async () => {
  tocSpy();
  [RES, ECO, GEO_M, GEO_D] = await Promise.all([getJSON('assets/data/resultados.json'), getJSON('assets/data/econometria.json'), getJSON('assets/data/geo/municipios.geojson'), getJSON('assets/data/geo/departamentos.geojson')]);
  RES.mapa.forEach(r => { MUNNAME[r.codigo] = r.municipio; });
  const U = [{ v: 'const', es: 'COP constantes 2025', en: 'Constant 2025 COP' }, { v: 'corr', es: 'COP corrientes', en: 'Current COP' }, { v: 'smmlv', es: 'Salarios mínimos', en: 'Minimum wages' }];
  segmented('c-ciud', U, st.ciudUnidad, v => { st.ciudUnidad = v; drawCiudades(); });
  segmented('c-grupo', [{ v: 'const', es: 'COP constantes 2025', en: 'Constant 2025 COP' }, { v: 'mediana', es: 'Mediana municipal', en: 'Municipal median' }, { v: 'smmlv', es: 'Salarios mínimos', en: 'Minimum wages' }], st.grupoUnidad, v => { st.grupoUnidad = v; drawGrupos(); });
  segmented('c-escala', [{ v: 'log', es: 'Logarítmica', en: 'Log' }, { v: 'linear', es: 'Lineal', en: 'Linear' }], st.grupoEscala, v => { st.grupoEscala = v; drawGrupos(); });
  segmented('c-dep', [{ v: 'presion', es: 'Total', en: 'Total' }, { v: 'presionPredial', es: 'Predial', en: 'Property' }, { v: 'presionIca', es: 'ICA', en: 'ICA' }], st.depImp, v => { st.depImp = v; drawMapDep(); });
  segmented('c-mun', [{ v: 'pc', es: 'COP 2025 por habitante', en: 'COP 2025 per capita' }, { v: 'smmlv', es: 'Salarios mínimos', en: 'Minimum wages' }, { v: 'autonomia', es: 'Autonomía', en: 'Autonomy' }, { v: 'crec', es: 'Crecimiento', en: 'Growth' }, { v: 'esf', es: 'Esfuerzo relativo', en: 'Relative effort' }], st.munVar, v => { st.munVar = v; drawMapMun(); });
  drawAll();
  REDRAW.push(drawAll);
  REDRAW.push(() => document.querySelectorAll('.seg button').forEach(b => { b.textContent = b.dataset[LANG]; }));
});
