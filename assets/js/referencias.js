/* Referencias en formato de autor y año (estilo Elsevier Harvard). Las páginas se unen con "a" o "to" según el idioma. */
const REFS = [
  { a: 'Abadie, A., 2021.', t: 'Using synthetic controls: Feasibility, data requirements, and methodological aspects.', j: 'Journal of Economic Literature 59 (2),', p: [391, 425], u: 'https://doi.org/10.1257/jel.20191450' },
  { a: 'Abadie, A., Diamond, A., Hainmueller, J., 2010.', t: "Synthetic control methods for comparative case studies: Estimating the effect of California's tobacco control program.", j: 'Journal of the American Statistical Association 105 (490),', p: [493, 505], u: 'https://doi.org/10.1198/jasa.2009.ap08746' },
  { a: 'Bahl, R., Linn, J., 2014.', t: 'Governing and Financing Cities in the Developing World.', j: 'Policy Focus Report. Lincoln Institute of Land Policy, Cambridge, MA.', u: 'https://scholar.google.com/scholar?q=Bahl%20Linn%20Governing%20and%20Financing%20Cities%20in%20the%20Developing%20World' },
  { a: 'Bai, J., Perron, P., 1998.', t: 'Estimating and testing linear models with multiple structural changes.', j: 'Econometrica 66 (1),', p: [47, 78], u: 'https://doi.org/10.2307/2998540' },
  { a: 'Barro, R.J., Sala i Martin, X., 1992.', t: 'Convergence.', j: 'Journal of Political Economy 100 (2),', p: [223, 251], u: 'https://doi.org/10.1086/261816' },
  { a: 'Bird, R.M., 2011.', t: 'Subnational taxation in developing countries: A review of the literature.', j: 'Journal of International Commerce, Economics and Policy 2 (1),', p: [139, 161], u: 'https://scholar.google.com/scholar?q=Bird%20Subnational%20taxation%20in%20developing%20countries%3A%20A%20review%20of%20the%20literature' },
  { a: 'Bonet, J., 2006.', t: 'Fiscal decentralization and regional income disparities: Evidence from the Colombian experience.', j: 'The Annals of Regional Science 40 (3),', p: [661, 676], u: 'https://scholar.google.com/scholar?q=Bonet%20Fiscal%20decentralization%20and%20regional%20income%20disparities%20Colombian%20experience' },
  { a: 'Bonet Morón, J., Ayala García, J., Patiño Osorno, J.M., 2023.', t: 'La gestión fiscal de Barranquilla, 2000 a 2021.', j: 'Documentos de Trabajo sobre Economía Regional y Urbana 319. Banco de la República, Cartagena.', u: 'https://doi.org/10.32468/dtseru.319' },
  { a: 'Brollo, F., Nannicini, T., Perotti, R., Tabellini, G., 2013.', t: 'The political resource curse.', j: 'American Economic Review 103 (5),', p: [1759, 1796], u: 'https://doi.org/10.1257/aer.103.5.1759' },
  { a: 'Cameron, A.C., Miller, D.L., 2015.', t: 'A practitioner’s guide to cluster robust inference.', j: 'Journal of Human Resources 50 (2),', p: [317, 372], u: 'https://doi.org/10.3368/jhr.50.2.317' },
  { a: 'De Cesare, C.M., 2002.', t: 'Toward more effective property tax systems in Latin America.', j: 'Land Lines 14 (1). Lincoln Institute of Land Policy, Cambridge, MA.', u: 'https://www.lincolninst.edu/publications/articles/toward-more-effective-property-tax-systems-latin-america/' },
  { a: 'Drazen, A., Eslava, M., 2010.', t: 'Electoral manipulation via voter friendly spending: Theory and evidence.', j: 'Journal of Development Economics 92 (1),', p: [39, 52], u: 'https://scholar.google.com/scholar?q=Drazen%20Eslava%20Electoral%20manipulation%20via%20voter-friendly%20spending' },
  { a: 'Fisher, A., Rudin, C., Dominici, F., 2019.', t: "All models are wrong, but many are useful: Learning a variable's importance by studying an entire class of prediction models simultaneously.", j: 'Journal of Machine Learning Research 20 (177),', p: [1, 81], u: 'https://scholar.google.com/scholar?q=Fisher%20Rudin%20Dominici%20All%20models%20are%20wrong%20but%20many%20are%20useful%20variable%20importance' },
  { a: 'Friedman, J.H., 2001.', t: 'Greedy function approximation: A gradient boosting machine.', j: 'The Annals of Statistics 29 (5),', p: [1189, 1232], u: 'https://doi.org/10.1214/aos/1013203451' },
  { a: 'Gadenne, L., 2017.', t: 'Tax me, but spend wisely? Sources of public finance and government accountability.', j: 'American Economic Journal: Applied Economics 9 (1),', p: [274, 314], u: 'https://scholar.google.com/scholar?q=Gadenne%20Tax%20me%2C%20but%20spend%20wisely%3F%20Sources%20of%20public%20finance%20and%20government%20accountability' },
  { a: 'Mullainathan, S., Spiess, J., 2017.', t: 'Machine learning: An applied econometric approach.', j: 'Journal of Economic Perspectives 31 (2),', p: [87, 106], u: 'https://doi.org/10.1257/jep.31.2.87' },
  { a: 'Norregaard, J., 2013.', t: 'Taxing immovable property: Revenue potential and implementation challenges.', j: 'IMF Working Paper 13/129. International Monetary Fund, Washington, DC.', u: 'https://www.imf.org/external/pubs/ft/wp/2013/wp13129.pdf' },
  { a: 'Oates, W.E., 1999.', t: 'An essay on fiscal federalism.', j: 'Journal of Economic Literature 37 (3),', p: [1120, 1149], u: 'https://doi.org/10.1257/jel.37.3.1120' },
  { a: 'OECD, 2022.', t: '2022 Synthesis Report: World Observatory on Subnational Government Finance and Investment.', j: 'OECD Publishing, Paris.', u: 'https://doi.org/10.1787/b80a8cdb-en' },
  { a: 'Otero, A., 2011.', t: 'Superando la crisis: las finanzas públicas de Barranquilla, 2000 a 2009.', j: 'Documentos de Trabajo sobre Economía Regional. Centro de Estudios Económicos Regionales, Banco de la República, Cartagena.', u: 'https://repositorio.banrep.gov.co/bitstreams/ce301209-254f-4e02-9c0e-d16cd45af328/download' },
  { a: 'Rogoff, K., 1990.', t: 'Equilibrium political budget cycles.', j: 'American Economic Review 80 (1),', p: [21, 36], u: 'https://scholar.google.com/scholar?q=Rogoff%20Equilibrium%20political%20budget%20cycles' },
  { a: 'Shi, M., Svensson, J., 2006.', t: 'Political budget cycles: Do they differ across countries and why?', j: 'Journal of Public Economics 90 (8),', p: [1367, 1389], u: 'https://doi.org/10.1016/j.jpubeco.2005.09.009' },
  { a: 'Slack, E., Bird, R.M., 2014.', t: 'The political economy of property tax reform.', j: 'OECD Working Papers on Fiscal Federalism 18. OECD Publishing, Paris.', u: 'https://scholar.google.com/scholar?q=Slack%20Bird%20The%20political%20economy%20of%20property%20tax%20reform%20OECD%20Working%20Papers%20on%20Fiscal%20Federalism' },
  { a: 'Smolka, M.O., 2013.', t: 'Implementing Value Capture in Latin America: Policies and Tools for Urban Development.', j: 'Policy Focus Report. Lincoln Institute of Land Policy, Cambridge, MA.', u: 'https://scholar.google.com/scholar?q=Smolka%20Implementing%20Value%20Capture%20in%20Latin%20America' },
  { a: 'Strobl, C., Boulesteix, A.L., Zeileis, A., Hothorn, T., 2007.', t: 'Bias in random forest variable importance measures: Illustrations, sources and a solution.', j: 'BMC Bioinformatics 8, 25.', u: 'https://doi.org/10.1186/1471-2105-8-25' }
];
const NORMS = [
  ['Constitución Política de Colombia, 1991. Artículos 287, 294, 317, 322 y 338.', 'Political Constitution of Colombia, 1991. Articles 287, 294, 317, 322 and 338.'],
  ['Ley 14 de 1983, por la cual se fortalecen los fiscos de las entidades territoriales.', 'Law 14 of 1983, strengthening the finances of territorial entities.'],
  ['Decreto Ley 1333 de 1986, Código de Régimen Municipal.', 'Decree Law 1333 of 1986, Municipal Regime Code.'],
  ['Ley 44 de 1990, impuesto predial unificado.', 'Law 44 of 1990, unified property tax.'],
  ['Decreto Ley 1421 de 1993, régimen especial para el Distrito Capital de Santafé de Bogotá.', 'Decree Law 1421 of 1993, special regime for the Capital District of Bogotá.'],
  ['Ley 136 de 1994, organización y funcionamiento de los municipios.', 'Law 136 of 1994, organization and functioning of municipalities.'],
  ['Ley 388 de 1997, desarrollo territorial y participación en plusvalías.', 'Law 388 of 1997, territorial development and land value increment charge.'],
  ['Ley 617 de 2000, categorización de las entidades territoriales y racionalización del gasto.', 'Law 617 of 2000, categorization of territorial entities and spending rationalization.'],
  ['Ley 1551 de 2012, modernización de la organización y el funcionamiento de los municipios.', 'Law 1551 of 2012, modernization of municipal organization and functioning.'],
  ['Ley 1581 de 2012, protección de datos personales.', 'Law 1581 of 2012, personal data protection.'],
  ['Ley 1712 de 2014, transparencia y derecho de acceso a la información pública nacional.', 'Law 1712 of 2014, transparency and right of access to public information.'],
  ['Decreto 103 de 2015, reglamentario de la Ley 1712 de 2014.', 'Decree 103 of 2015, regulating Law 1712 of 2014.'],
  ['Documento CONPES 3920 de 2018, Política Nacional de Explotación de Datos (Big Data).', 'CONPES document 3920 of 2018, National Data Exploitation Policy (Big Data).'],
  ['Documento CONPES 3958 de 2019, estrategia para la implementación de la política pública de catastro multipropósito.', 'CONPES document 3958 of 2019, strategy for implementing the multipurpose cadastre policy.'],
  ['Ley 1955 de 2019, Plan Nacional de Desarrollo 2018 a 2022.', 'Law 1955 of 2019, National Development Plan 2018 to 2022.'],
  ['Ley 1995 de 2019, normas catastrales e impuestos sobre la propiedad raíz.', 'Law 1995 of 2019, cadastral rules and real estate taxes.'],
  ['Acto Legislativo 02 de 2020, Región Metropolitana Bogotá Cundinamarca.', 'Legislative Act 02 of 2020, Bogotá Cundinamarca Metropolitan Region.'],
  ['Ley 2199 de 2022, régimen especial de la Región Metropolitana Bogotá Cundinamarca.', 'Law 2199 of 2022, special regime of the Bogotá Cundinamarca Metropolitan Region.'],
  ['Ley 2294 de 2023, Plan Nacional de Desarrollo 2022 a 2026.', 'Law 2294 of 2023, National Development Plan 2022 to 2026.']
];
const DATAS = [
  ['Departamento Nacional de Planeación (DNP), 2026. Operaciones Efectivas de Caja municipales 2000 a 2025 y ejecuciones presupuestales municipales 1984 a 1999. Dirección de Descentralización y Fortalecimiento Fiscal. Consulta: octubre de 2026.', 'National Planning Department (DNP), 2026. Municipal Cash Operations 2000 to 2025 and municipal budget execution 1984 to 1999. Directorate of Decentralization and Fiscal Strengthening. Accessed October 2026.', 'https://www.dnp.gov.co/'],
  ['Departamento Administrativo Nacional de Estadística (DANE), 2025. Proyecciones y retroproyecciones de población municipal 1985 a 2042, con base en el Censo Nacional de Población y Vivienda 2018.', 'National Administrative Department of Statistics (DANE), 2025. Municipal population projections and back projections 1985 to 2042, based on the 2018 National Population and Housing Census.', 'https://www.dane.gov.co/index.php/estadisticas-por-tema/demografia-y-poblacion/proyecciones-de-poblacion'],
  ['DANE, 2026. Cuentas nacionales departamentales: PIB por departamento, retropolación 1980 a 2025 y valor agregado municipal 2011 a 2024.', 'DANE, 2026. Departmental national accounts: GDP by department, back cast 1980 to 2025, and municipal value added 2011 to 2024.', 'https://www.dane.gov.co/index.php/estadisticas-por-tema/cuentas-nacionales/cuentas-nacionales-departamentales'],
  ['DANE, 2026. Índice de precios al consumidor, series de empalme 2003 a 2026.', 'DANE, 2026. Consumer price index, linked series 2003 to 2026.', 'https://www.dane.gov.co/index.php/estadisticas-por-tema/precios-y-costos/indice-de-precios-al-consumidor-ipc'],
  ['DANE, 2018. Marco Geoestadístico Nacional, capa municipal; versión simplificada para visualización.', 'DANE, 2018. National Geostatistical Framework, municipal layer; simplified version for visualization.', 'https://geoportal.dane.gov.co/'],
  ['Banco de la República, 2026. Salario mínimo legal en Colombia e índice de precios al consumidor histórico.', 'Banco de la República, 2026. Legal minimum wage in Colombia and historical consumer price index.', 'https://www.banrep.gov.co/'],
  ['Contaduría General de la Nación, 2025. Histórico de categorización de departamentos, distritos y municipios hasta la vigencia 2025.', 'National Accounting Office, 2025. History of categorization of departments, districts and municipalities through fiscal year 2025.', 'https://www.contaduria.gov.co/categorizacion-de-departamentos-distritos-y-municipios']
];
function renderRefs() {
  const sep = T(' a ', ' to ');
  const r = document.getElementById('ref-list');
  if (r) r.innerHTML = REFS.map(x => `<p>${x.a} ${x.t} <i>${x.j}</i>${x.p ? ' ' + T('pp. ', 'pp. ') + x.p[0] + sep + x.p[1] + '.' : ''} <a href="${x.u}" target="_blank" rel="noopener">${T('Enlace', 'Link')}</a></p>`).join('');
  const n = document.getElementById('norm-list');
  if (n) n.innerHTML = NORMS.map(x => `<p>${T(x[0], x[1])}</p>`).join('');
  const d = document.getElementById('data-list');
  if (d) d.innerHTML = DATAS.map(x => `<p>${T(x[0], x[1])} <a href="${x[2]}" target="_blank" rel="noopener">${T('Enlace', 'Link')}</a></p>`).join('');
}
document.addEventListener('DOMContentLoaded', () => { renderRefs(); REDRAW.push(renderRefs); });
