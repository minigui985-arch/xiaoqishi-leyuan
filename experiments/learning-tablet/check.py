"""Check against the immutable R11 source; no website files are changed."""
from pathlib import Path
import subprocess
import tempfile
from build import generate

revision = '71e1f46d7fd6af359c55923d3c30be635afc0f2a'
with tempfile.TemporaryDirectory() as directory:
    site = Path(directory)
    originals = {}
    for source, target in [('小骑士乐园-统一主题版.html', 'index.html'),
                           ('chess-3d.js', 'chess-3d.js'),
                           ('chess-3d-scene.mjs', 'chess-3d-scene.mjs')]:
        data = subprocess.check_output(['git', 'show', f'{revision}:{source}'])
        originals[target] = data
        (site / target).write_bytes(data)
    outputs = generate(site)
    assert len(outputs) == 3
    assert all((site / name).read_bytes() == data for name, data in originals.items())
    for name in ('chess-3d-tablet.js', 'chess-3d-scene-tablet.mjs'):
        subprocess.run(['node', '--check', str(site / name)], check=True)
    assert 'chess-3d-tablet.js?v=tablet-20261027' in outputs['tablet-test.html']
    assert 'antialias:false' in outputs['chess-3d-scene-tablet.mjs']
    assert 'Math.sqrt(600000/(w*h))' in outputs['chess-3d-scene-tablet.mjs']
    (site / 'chess-3d.js').write_text('incompatible version', encoding='utf-8')
    try:
        generate(site)
    except ValueError:
        pass
    else:
        raise AssertionError('Incompatible source must fail')
    assert all((site / name).read_text(encoding='utf-8') == text for name, text in outputs.items())
print('PASS: R11 isolation, generated script syntax, low-load settings, incompatible-source guard')
