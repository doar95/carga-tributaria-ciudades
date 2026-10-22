/* Utilidades compartidas: idioma, paleta GOV.CO, formatos y estilos de Plotly */
const GOV = {
  cobalt: '#0943B5', havelock: '#4672C8', portage: '#83A0DA', tropical: '#B5C7E9', solitude: '#E5ECF8',
  red: '#A80521', orange: '#F0572D', yellow: '#FDAA29', green: '#158361', golden: '#9D7700',
  sunglow: '#FECC2F', matterhorn: '#4C4C4C', grey: '#7E7E7E', silver: '#B9B9B9', smoke: '#F4F4F4'
};
// Bogotá siempre en rojo. Las demás ciudades usan color y patrón de línea (codificación secundaria).
const CIUDAD = {
  'Bogotá': { c: GOV.red, dash: 'solid', w: 3.4 },
  'Barranquilla': { c: GOV.cobalt, dash: 'solid', w: 2 },
  'Medellín': { c: GOV.green, dash: 'dash', w: 2 },
  'Cali': { c: GOV.golden, dash: 'dot', w: 2.2 },
  'Cartagena': { c: GOV.orange, dash: 'dashdot', w: 2 },
  'Bucaramanga': { c: GOV.grey, dash: 'longdash', w: 2 }
};
const GRUPO = {
  'Bogotá D.C.': { c: GOV.red, dash: 'solid', w: 3.4, es: 'Bogotá D.C.', en: 'Bogotá D.C.' },
  'Especial (sin Bogotá)': { c: '#062f80', dash: 'solid', w: 2.2, es: 'Especial sin Bogotá', en: 'Special, excl. Bogotá' },
  'Categoría 1': { c: GOV.cobalt, dash: 'dash', w: 2, es: 'Categoría 1', en: 'Category 1' },
  'Categoría 2': { c: GOV.havelock, dash: 'solid', w: 2, es: 'Categoría 2', en: 'Category 2' },
  'Categoría 3': { c: GOV.havelock, dash: 'dot', w: 2.2, es: 'Categoría 3', en: 'Category 3' },
  'Categoría 4': { c: GOV.golden, dash: 'dash', w: 2, es: 'Categoría 4', en: 'Category 4' },
  'Categoría 5': { c: GOV.green, dash: 'solid', w: 2, es: 'Categoría 5', en: 'Category 5' },
  'Categoría 6': { c: GOV.grey, dash: 'solid', w: 2, es: 'Categoría 6', en: 'Category 6' }
};
const SEQ = [[0, '#F4F4F4'], [0.25, '#B5C7E9'], [0.5, '#83A0DA'], [0.75, '#4672C8'], [1, '#062f80']];

let LANG = 'es';
try { const s = localStorage.getItem('ctLang'); if (s === 'en' || s === 'es') LANG = s; } catch (e) {}
const URLLANG = new URLSearchParams(location.search).get('lang');
if (URLLANG === 'en' || URLLANG === 'es') LANG = URLLANG;
const T = (es, en) => (LANG === 'en' ? en : es);
const REDRAW = [];
function setLang(l) {
  LANG = l;
  try { localStorage.setItem('ctLang', l); } catch (e) {}
  document.body.classList.toggle('lang-en', l === 'en');
  document.body.classList.toggle('lang-es', l === 'es');
  document.documentElement.lang = l;
  document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.l === l));
  document.querySelectorAll('[data-es]').forEach(e => { e.textContent = e.dataset[l]; });
  REDRAW.forEach(f => f());
}
function fmtNum(v, d = 0) {
  if (v === null || v === undefined || isNaN(v)) return T('sin dato', 'no data');
  return v.toLocaleString(LANG === 'en' ? 'en-US' : 'es-CO', { minimumFractionDigits: d, maximumFractionDigits: d }).replace('-', '\u2212');
}
function fmtCOP(v) { return 'COP ' + fmtNum(v, 0); }
function fmtPct(v, d = 1) { return (v === null || v === undefined) ? T('sin dato', 'no data') : fmtNum(v * 100, d) + ' %'; }
const SEP = () => (LANG === 'en' ? ',' : '.');
function baseLayout(extra = {}) {
  const l = {
    font: { family: '"Source Sans 3", "Segoe UI", Verdana, sans-serif', size: 12.5, color: '#333' },
    paper_bgcolor: '#fff', plot_bgcolor: '#fff',
    margin: { l: 70, r: 24, t: 14, b: 54 },
    hovermode: 'x unified',
    hoverlabel: { bgcolor: '#fff', bordercolor: '#bbb', font: { size: 12.5, color: '#222' } },
    separators: LANG === 'en' ? '.,' : ',.',
    xaxis: { showgrid: false, linecolor: '#999', ticks: 'outside', tickcolor: '#999', automargin: true, zeroline: false },
    yaxis: { gridcolor: '#ececec', linecolor: '#999', zeroline: false, automargin: true, tickformat: ',.0f' },
    legend: { orientation: 'h', x: 0, y: -0.18, xanchor: 'left', yanchor: 'top', font: { size: 12 } }
  };
  return deepMerge(l, extra);
}
function deepMerge(a, b) {
  for (const k in b) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') a[k] = deepMerge({ ...a[k] }, b[k]);
    else a[k] = b[k];
  }
  return a;
}
const PCFG = { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'], topojsonURL: 'assets/data/geo/' };
function plot(id, data, layout) {
  const el = document.getElementById(id);
  if (!el) return;
  Plotly.react(el, data, layout, PCFG);
}
function segmented(id, opts, initial, onChange) {
  const box = document.getElementById(id);
  if (!box) return;
  box.innerHTML = '';
  box.classList.add('seg');
  let cur = initial;
  opts.forEach(o => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.v = o.v;
    b.dataset.es = o.es; b.dataset.en = o.en;
    b.textContent = LANG === 'en' ? o.en : o.es;
    if (o.v === cur) b.classList.add('on');
    b.onclick = () => { cur = o.v; box.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.v === cur)); onChange(cur); };
    box.appendChild(b);
  });
}
// En la versión autocontenida los datos vienen incrustados en window.EMBED y no se descargan.
async function getJSON(u) {
  if (window.EMBED && window.EMBED[u]) return window.EMBED[u];
  const r = await fetch(u); return r.json();
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.l)));
  const mb = document.querySelector('.menu-btn');
  const toc = document.querySelector('.toc');
  if (mb && toc) {
    mb.addEventListener('click', () => toc.classList.toggle('open'));
    toc.addEventListener('click', e => { if (e.target.tagName === 'A') toc.classList.remove('open'); });
  }
  setLang(LANG);
});
