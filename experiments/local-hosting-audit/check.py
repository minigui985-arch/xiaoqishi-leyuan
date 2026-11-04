"""Read-only R11 package/static-hosting checks; not device acceptance."""
from pathlib import Path
import hashlib
import json
import re
import zipfile

root = Path(__file__).resolve().parents[2]
site = root / 'device-test-20261024-r6/site'
apk_dir = root / 'device-test-20261026-r11'
record = json.loads((apk_dir / 'apk-verification.json').read_text(encoding='utf-8'))
apk = apk_dir / record['apk']
assert hashlib.sha256(apk.read_bytes()).hexdigest() == record['sha256'], 'APK changed'
with zipfile.ZipFile(apk) as archive:
    assert archive.testzip() is None, 'Corrupt APK'
    names = set(archive.namelist())
    required = ['index.html', 'chess-3d.js', 'chess-3d-scene.mjs', 'stockfish-engine.js',
                'vendor/stockfish/stockfish-18-lite-single.wasm',
                'vendor/three/three.module.js', 'vendor/three/three.core.js']
    assert all('assets/public/' + name in names for name in required), 'Missing runtime'
    models = [n for n in names if n.startswith('assets/public/assets/models/') and n.endswith('.glb')]
    assert len(models) == 24, 'Unexpected model inventory'
files = [p for p in site.rglob('*') if p.is_file()]
web = [p for p in files if p.suffix.lower() != '.apk']
sw = (site / 'service-worker.js').read_text(encoding='utf-8')
core = re.findall(r"'\./([^']+)'", sw.split('self.addEventListener')[0])
missing = [name for name in core if not (site / name).is_file()]
assert not missing, f'Missing precache resources: {missing}'
result = {
    'scope': 'R11 local package and static resource inspection only',
    'apk_sha256_verified': record['sha256'], 'apk_crc_passed': True,
    'apk_embedded_glb_count': len(models), 'apk_required_runtime_present': required,
    'web_file_count_excluding_apk': len(web),
    'web_bytes_excluding_apk': sum(p.stat().st_size for p in web),
    'largest_web_files': [{'path': p.relative_to(site).as_posix(), 'bytes': p.stat().st_size}
                          for p in sorted(web, key=lambda p: p.stat().st_size, reverse=True)[:8]],
    'web_files_over_25_MiB': [p.relative_to(site).as_posix() for p in web if p.stat().st_size > 25*1024*1024],
    'excluded_apk_downloads': [p.name for p in files if p.suffix.lower() == '.apk'],
    'precache_local_paths_present': len(core),
    'glb_explicitly_precached': '.glb' in sw.split('self.addEventListener')[0],
    'device_airplane_mode_test': 'not performed',
    'hosting_deployment_test': 'not performed',
    'domestic_network_isolation': 'not passed: friend-config.js still specifies international API',
}
(Path(__file__).parent / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps(result, ensure_ascii=False, indent=2))
