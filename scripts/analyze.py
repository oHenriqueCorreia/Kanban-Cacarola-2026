"""Rebuild campaign data from the original exports, then rebuild the page."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
for name in ('analisar.py', 'consolidar.py', 'preparar_entrega.py'):
    subprocess.run([sys.executable, str(ROOT / 'scripts/analysis' / name)], check=True)
subprocess.run([sys.executable, str(ROOT / 'scripts/build.py')], check=True)
