"""
Verifica los archivos oficiales subidos por el usuario contra insumos/MANIFIESTO.csv (huella SHA256)
y arma la carpeta de trabajo con los nombres que esperan los scripts.

Uso: python code/00_verificar_insumos.py CARPETA_CON_ARCHIVOS_SUBIDOS CARPETA_DESTINO
Los archivos se identifican por su contenido, no por su nombre. Si falta alguno, se copia desde insumos/.
"""
import csv, hashlib, shutil, sys
from pathlib import Path
R = Path(__file__).resolve().parents[1]
src = Path(sys.argv[1]) if len(sys.argv) > 1 else None
dst = Path(sys.argv[2]) if len(sys.argv) > 2 else R / 'trabajo' / 'insumos'
dst.mkdir(parents=True, exist_ok=True)
man = list(csv.DictReader(open(R / 'insumos' / 'MANIFIESTO.csv', encoding='utf-8')))
por_hash = {}
if src and src.exists():
    for f in src.rglob('*'):
        if f.is_file():
            por_hash.setdefault(hashlib.sha256(f.read_bytes()).hexdigest(), f)
ok, rep = 0, 0
print(f"{'ARCHIVO ESPERADO':45s} RESULTADO")
for m in man:
    f = por_hash.get(m['sha256'])
    if f:
        shutil.copy2(f, dst / m['nombreEnRepositorio']); ok += 1
        print(f"{m['nombreOriginal'][:45]:45s} IDENTICO (subido como {f.name})")
    else:
        copia = R / 'insumos' / m['nombreEnRepositorio']
        integro = hashlib.sha256(copia.read_bytes()).hexdigest() == m['sha256']
        shutil.copy2(copia, dst / m['nombreEnRepositorio']); rep += 1
        estado = 'huella verificada' if integro else 'ATENCION: la huella NO coincide con el manifiesto'
        print(f"{m['nombreOriginal'][:45]:45s} copia del repositorio ({estado})")
print(f"\n{ok} archivos subidos coinciden byte a byte; {rep} se tomaron del repositorio. Carpeta lista: {dst}")
