"""One CPU-only image-to-3D control, not a final character or PBR asset."""
from pathlib import Path
import argparse,hashlib,json,os,struct,sys,time

parser=argparse.ArgumentParser()
parser.add_argument('--source',required=True)
parser.add_argument('--weights',required=True)
parser.add_argument('--output',required=True)
args=parser.parse_args()
sys.path.insert(0,str(Path(args.source).resolve()))

import numpy as np
from PIL import Image
import rembg
import torch
from tsr.system import TSR
from tsr.utils import resize_foreground

root=Path(__file__).resolve().parents[1]
input_path=root/'character-samples-20261023/image-to-3d-pilot/inputs/crusader-front.png'
assert hashlib.sha256(input_path.read_bytes()).hexdigest()=='1c135df6a729731d38954e80578f0bc2e7e7ff5e036892b0d316d90fd9d94601'
output=Path(args.output);output.mkdir(parents=True,exist_ok=True)
torch.set_num_threads(4);torch.manual_seed(20261023);np.random.seed(20261023)
started=time.monotonic()
print('PILOT_STAGE background-removal',flush=True)
original=Image.open(input_path).convert('RGB')
masked=rembg.remove(original,session=rembg.new_session('u2net',providers=['CPUExecutionProvider']))
masked.save(output/'input-alpha.png')
prepared=resize_foreground(masked,.85)
pixels=np.asarray(prepared).astype(np.float32)/255
image=Image.fromarray(np.round((pixels[:,:,:3]*pixels[:,:,3:4]+(1-pixels[:,:,3:4])*.5)*255).astype(np.uint8))
image.save(output/'input-model.png')
print('PILOT_STAGE loading-official-model',flush=True)
model=TSR.from_pretrained(args.weights,config_name='config.yaml',weight_name='model.ckpt').eval().to('cpu')
model.renderer.set_chunk_size(8192)
print('PILOT_STAGE image-to-triplane',flush=True)
with torch.inference_mode():codes=model([image],device='cpu')
print('PILOT_STAGE extracting-mesh-resolution-192',flush=True)
with torch.inference_mode():mesh=model.extract_mesh(codes,has_vertex_color=True,resolution=192)[0]
assert len(mesh.vertices)>1000 and len(mesh.faces)>1000
assert np.isfinite(mesh.vertices).all() and np.all(mesh.extents>0)
mesh.metadata.update(role='child-crusader-p',fidelityApproved=False,status='cpu-image-to-3d-control',generator='TripoSR')
file=output/'crusader-triposr-cpu.glb';mesh.export(file)
data=file.read_bytes();magic,version,total=struct.unpack_from('<III',data)
assert magic==0x46546c67 and version==2 and total==len(data)
length,kind=struct.unpack_from('<II',data,12);assert kind==0x4e4f534a
doc=json.loads(data[20:20+length])
assert any('COLOR_0' in p['attributes'] for m in doc['meshes'] for p in m['primitives'])
report={'model':'TripoSR','sourceCommit':'107cefdc244c39106fa830359024f6a2f1c78871','device':'cpu','singleView':True,'inputSha256':hashlib.sha256(input_path.read_bytes()).hexdigest(),'seed':20261023,'mcResolution':192,'vertices':len(mesh.vertices),'triangles':len(mesh.faces),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'seconds':round(time.monotonic()-started,2),'images':len(doc.get('images',[])),'animationCount':len(doc.get('animations',[])),'fidelityApproved':False,'limitations':'Older single-view control with vertex colors; no PBR textures, skinning, animation or visual approval.'}
(output/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('PILOT_RESULT '+json.dumps(report),flush=True)
