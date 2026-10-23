"""Lossless reference crops for the user-authorized single-character pilot."""
from pathlib import Path
import hashlib,json
from PIL import Image,ImageChops

root=Path(__file__).resolve().parents[1]
source=root/'character-samples-20261023/child-crusader-pawn-v1.png'
expected='8f23db2b8bd2b60e2be46b42f2bcde73405198f2978b6ef4ce7c3c2f1beefe97'
assert hashlib.sha256(source.read_bytes()).hexdigest()==expected
image=Image.open(source);assert image.size==(1536,1024)
folder=root/'character-samples-20261023/image-to-3d-pilot/inputs';folder.mkdir(parents=True,exist_ok=True)
boxes={'front':(16,40,475,552),'side':(478,40,742,552),'back':(748,40,1121,552),'quarter':(1120,40,1536,552)}
items=[]
for name,box in boxes.items():
    crop=image.crop(box);path=folder/f'crusader-{name}.png';crop.save(path)
    with Image.open(path) as saved:
        assert saved.size==crop.size and ImageChops.difference(crop,saved).getbbox() is None
    items.append({'view':name,'file':path.name,'box':box,'size':crop.size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
assert hashlib.sha256(source.read_bytes()).hexdigest()==expected
report={'source':source.name,'sourceSha256':expected,'operation':'pixel-exact crop only; no resize, redraw or background replacement','crops':items,'scope':'one child crusader pawn; free trials only','visualApproval':False}
(folder/'input-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
