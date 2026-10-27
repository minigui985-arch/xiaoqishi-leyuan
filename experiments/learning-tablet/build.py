"""Generate the opt-in tablet page beside an existing R11 test website."""
from pathlib import Path
import sys


def generate(site):
    changes = {
        'index.html': ('tablet-test.html', [
            ('chess-3d.js?v=armies-20261026-r11', 'chess-3d-tablet.js?v=tablet-20261027'),
            ('本机无语音', '此浏览器不支持语音'),
        ]),
        'chess-3d.js': ('chess-3d-tablet.js', [
            ('./chess-3d-scene.mjs?v=armies-20261026-r11', './chess-3d-scene-tablet.mjs?v=tablet-20261027'),
        ]),
        'chess-3d-scene.mjs': ('chess-3d-scene-tablet.mjs', [
            ('antialias:true', 'antialias:false'),
            ('const ratio=Math.min(devicePixelRatio||1,lowMemoryDevice?1.5:3,Math.sqrt((lowMemoryDevice?1000000:2500000)/(w*h)));',
             'const ratio=Math.min(devicePixelRatio||1,1,Math.sqrt(600000/(w*h)));'),
        ]),
    }
    outputs = {}
    for source, (target, replacements) in changes.items():
        text = (site / source).read_text(encoding='utf-8')
        for old, new in replacements:
            if text.count(old) != 1:
                raise ValueError(f'{source}: expected exactly one {old!r}; use the R11 site')
            text = text.replace(old, new)
        outputs[target] = text
    # Validate all inputs before writing; never modify the normal entry or scripts.
    for target, text in outputs.items():
        (site / target).write_text(text, encoding='utf-8')
    return outputs


if __name__ == '__main__':
    generate(Path(sys.argv[1]))
