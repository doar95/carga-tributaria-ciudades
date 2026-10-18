# Datos

Base municipal de ingresos tributarios de Colombia, 1984 a 2025. Licencia Creative Commons Atribución 4.0 (CC BY 4.0).

## Archivos

* `panelCargaTributaria1984a2025.csv`: panel municipio y año (46.201 filas, 54 variables). Codificación UTF8, separador coma.
* `diccionarioVariables.csv`: descripción de cada variable.
* `presionTributariaDepartamental1985a2025.csv`: tributos municipales agregados por departamento sobre PIB departamental, con cobertura de reporte.
* `intermedios/`: población municipal 1985 a 2025, IPC y salario mínimo, categorías CGN 2003 a 2025, PIB departamental y valor agregado municipal, extraídos de los archivos oficiales.

## Variables

| Variable | Descripción |
|---|---|
| `codigo` | Código Divipola del municipio (5 dígitos) |
| `municipio` | Nombre del municipio (DANE) |
| `codDepto` | Código Divipola del departamento |
| `departamento` | Nombre del departamento |
| `anio` | Vigencia fiscal |
| `categoria` | Categoría municipal de la vigencia (CGN; E especial, 1 a 6). Disponible 2003 a 2025 |
| `categoria2025` | Categoría vigente en 2025, usada para grupos fijos |
| `grupoComparacion` | Grupo de comparación: Bogotá, especial sin Bogotá, categorías 1 a 6 |
| `pob` | Población total (DANE, proyecciones con base en el Censo 2018) |
| `pobCabecera` | Población en cabecera municipal |
| `participacionUrbana` | Población en cabecera sobre población total |
| `smmlv` | Salario mínimo mensual legal vigente, COP corrientes (Banco de la República) |
| `ipcDic` | IPC de diciembre, base diciembre 2018 = 100 (DANE 2003 a 2025; Banco de la República antes) |
| `factor2025` | Factor para expresar COP corrientes del año en COP de 2025 |
| `reporta` | 1 si el municipio reporta ingresos totales positivos |
| `alertaCalidad` | 1 si el recaudo real per cápita se aleja más de tres veces de la mediana móvil de siete años |
| `fuente` | Fuente fiscal: ejecuciones presupuestales (1984 a 1999) u OEC (2000 a 2025) |
| `ingresosTotales` | Ingresos totales, millones de COP corrientes |
| `ingresosCorrientes` | Ingresos corrientes, millones de COP corrientes |
| `tributarios` | Ingresos tributarios, millones de COP corrientes |
| `predial` | Impuesto predial, millones de COP corrientes |
| `ica` | Impuesto de industria y comercio, millones de COP corrientes |
| `otrosTributarios` | Otros tributos incluida la sobretasa a la gasolina, millones de COP corrientes |
| `sobretasaGasolina` | Sobretasa a la gasolina (desagregada desde 2000), millones de COP corrientes |
| `noTributarios` | Ingresos no tributarios, millones de COP corrientes |
| `transferenciasCorrientes` | Transferencias corrientes, millones de COP corrientes |
| `transferenciasCapital` | Transferencias nacionales de capital (SGP y otras), millones de COP corrientes |
| `regalias` | Regalías, millones de COP corrientes |
| `gastosTotales` | Gastos totales, millones de COP corrientes |
| `funcionamiento` | Gastos de funcionamiento, millones de COP corrientes |
| `inversion` | Gastos de capital (inversión), millones de COP corrientes |
| `tributariosConst2025` | Ingresos tributarios, millones de COP constantes de 2025 |
| `predialConst2025` | Impuesto predial, millones de COP constantes de 2025 |
| `icaConst2025` | Impuesto de industria y comercio, millones de COP constantes de 2025 |
| `otrosTributariosConst2025` | Otros tributos incluida la sobretasa a la gasolina, millones de COP constantes de 2025 |
| `ingresosTotalesConst2025` | Ingresos totales, millones de COP constantes de 2025 |
| `transferenciasCorrientesConst2025` | Transferencias corrientes, millones de COP constantes de 2025 |
| `transferenciasCapitalConst2025` | Transferencias nacionales de capital (SGP y otras), millones de COP constantes de 2025 |
| `regaliasConst2025` | Regalías, millones de COP constantes de 2025 |
| `pcTributarios2025` | Ingresos tributarios por habitante, COP constantes de 2025 |
| `pcPredial2025` | Predial por habitante, COP constantes de 2025 |
| `pcIca2025` | ICA por habitante, COP constantes de 2025 |
| `pcOtrosTributarios2025` | Otros tributos por habitante, COP constantes de 2025 |
| `pcTransferencias2025` | Transferencias por habitante, COP constantes de 2025 |
| `pcRegalias2025` | Regalías por habitante, COP constantes de 2025 |
| `tributariosSMMLVpc` | Ingresos tributarios por habitante en salarios mínimos mensuales |
| `predialSMMLVpc` | Predial por habitante en salarios mínimos mensuales |
| `icaSMMLVpc` | ICA por habitante en salarios mínimos mensuales |
| `autonomiaTributaria` | Ingresos tributarios sobre ingresos totales |
| `participacionPredial` | Predial sobre ingresos tributarios |
| `participacionICA` | ICA sobre ingresos tributarios |
| `vaMunicipal` | Valor agregado municipal, miles de millones de COP corrientes (DANE, 2011 a 2024) |
| `pcVA2025` | Valor agregado por habitante, COP constantes de 2025 |
| `tributariosSobreVA` | Ingresos tributarios sobre valor agregado municipal |

## Fuentes oficiales

* Departamento Nacional de Planeación (DNP), Dirección de Descentralización y Fortalecimiento Fiscal: ejecuciones presupuestales municipales 1984 a 1999 y Operaciones Efectivas de Caja municipales 2000 a 2025 (con SGR; nota metodológica del 14 de agosto de 2026 sobre ajustes CUIPO 2025).
* DANE: proyecciones y retroproyecciones de población municipal 1985 a 2042 (Censo 2018; actualización de julio de 2025); PIB departamental (retropolación 1980 a 2025 y serie 2005 a 2025); valor agregado municipal 2011 a 2024; IPC series de empalme.
* Banco de la República: salario mínimo legal e IPC histórico.
* Contaduría General de la Nación: histórico de categorización hasta la vigencia 2025.

El acceso a estos datos se ampara en la Ley 1712 de 2014, el Decreto 103 de 2015 y el documento CONPES 3920 de 2018. La base no contiene datos personales.

## Reglas de construcción

1. Solo se usa la cuenta de ingresos tributarios y sus componentes; la sobretasa a la gasolina se suma a otros tributos para comparar con 1984 a 1999.
2. Registros con ingresos totales nulos o cero se tratan como no reporte; no se imputan valores.
3. Valores constantes con IPC de diciembre, base 2025.
4. La alerta de calidad se conserva en la base; los agregados del documento la excluyen.
5. 1984 no tiene población oficial comparable y se publica sin indicadores per cápita.

Para reproducir la base ejecute los scripts de `code/` en orden (ver README principal).
