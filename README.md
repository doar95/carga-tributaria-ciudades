# Carga tributaria de las ciudades principales de Colombia, 1985 a 2025

Preprint dinámico y base de datos abierta sobre ingresos tributarios municipales de Colombia (1984 a 2025), con énfasis en Bogotá y un enfoque diferencial por categorías municipales.

* Documento (español e inglés): https://doar95.github.io/carga-tributaria-ciudades/
* Explorador interactivo: https://doar95.github.io/carga-tributaria-ciudades/explorador.html
* Datos: carpeta [`data/`](data/) (licencia CC BY 4.0)

**Autores:** Laura Salas (Magíster en Economía), David Aguilar (Economista, Máster en Ciencia de Datos) y Claude (modelo de inteligencia artificial de Anthropic). Versión 1.0, octubre de 2026. Documento sin revisión por pares.

## Contenido

| Ruta | Descripción |
|---|---|
| `index.html` | Documento estilo artículo con figuras dinámicas, mapas y traducción al inglés |
| `explorador.html` | Tablero con filtros por indicador, año, departamento, categoría y municipio |
| `data/` | Base pública, diccionario, presión departamental e insumos intermedios |
| `code/` | Scripts de construcción y análisis en Python |
| `assets/` | Estilos, scripts y salidas en JSON que alimentan el sitio |

## Reproducción

Requiere Python 3.11 o superior con `pandas`, `numpy`, `openpyxl`, `xlrd`, `pyarrow`, `statsmodels`, `scikit-learn` y `scipy`. Descargue los archivos oficiales listados en `data/README.md` en una carpeta y ejecute:

```bash
python code/01_construir_panel.py RUTA_ARCHIVOS   # panel base, población, IPC, salario mínimo, categorías, PIB
python code/02_indicadores.py                     # indicadores y base pública
python code/03_analisis.py                        # agregados, presión tributaria y datos de mapas
python code/04_econometria_ml.py                  # convergencia, ciclo político, control sintético y aprendizaje automático
python code/05_exportar_web.py                    # series compactas para el explorador
```

El script 04 lee el PIB en volumen desde la misma carpeta de archivos oficiales (ajuste la variable `RAW` si es necesario).

## Fuentes y normativa de datos abiertos

DNP (Operaciones Efectivas de Caja y ejecuciones presupuestales), DANE (población, cuentas departamentales, IPC, Marco Geoestadístico Nacional), Banco de la República (salario mínimo, IPC histórico) y Contaduría General de la Nación (categorización). El uso de estos datos se ampara en la Ley 1712 de 2014, el Decreto 103 de 2015 y el documento CONPES 3920 de 2018. La paleta de colores sigue la guía de GOV.CO.

## Licencias

Datos: Creative Commons Atribución 4.0 Internacional. Código: MIT.
