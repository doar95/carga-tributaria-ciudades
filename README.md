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
| `insumos/` | Archivos oficiales de entrada y manifiesto con huellas SHA256 |
| `sitio_autocontenido/` | Las dos páginas en un solo archivo cada una, para abrir con doble clic sin servidor |
| `assets/` | Estilos, scripts y salidas en JSON que alimentan el sitio |

## Reproducción

La carpeta `insumos/` contiene copias de los 14 archivos oficiales usados, con su nombre original, tamaño y huella SHA256 en `insumos/MANIFIESTO.csv`. Con Python 3.13 y las librerías de `requirements.txt`:

```bash
pip install -r requirements.txt
python code/00_verificar_insumos.py CARPETA_CON_SUS_ARCHIVOS trabajo/insumos   # compara sus archivos con el manifiesto
python code/01_construir_panel.py trabajo/insumos
python code/02_indicadores.py
python code/03_analisis.py
python code/04_econometria_ml.py trabajo/insumos
python code/05_exportar_web.py
python code/06_sitio_autocontenido.py   # index.html y explorador.html autocontenidos en sitio_autocontenido/
```

El proceso tarda unos cuatro minutos. Con estos insumos y versiones, `assets/data/*.json` y `data/panelCargaTributaria1984a2025.csv` se reproducen byte a byte (verificado el 22 de octubre de 2026).

## Fuentes y normativa de datos abiertos

DNP (Operaciones Efectivas de Caja y ejecuciones presupuestales), DANE (población, cuentas departamentales, IPC, Marco Geoestadístico Nacional), Banco de la República (salario mínimo, IPC histórico) y Contaduría General de la Nación (categorización). El uso de estos datos se ampara en la Ley 1712 de 2014, el Decreto 103 de 2015 y el documento CONPES 3920 de 2018. La paleta de colores sigue la guía de GOV.CO.

## Licencias

Datos: Creative Commons Atribución 4.0 Internacional. Código: MIT.
