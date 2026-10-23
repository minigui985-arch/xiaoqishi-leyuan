from pathlib import Path
import hashlib, json, struct

folder=Path(__file__).resolve().parents[1]/'character-samples-20261023'
report=json.loads((folder/'sample-manifest.json').read_text(encoding='utf-8'))
assert report['approval']=='rework-required' and len(report['samples'])==2
results=[]
for faction,clip in [('crusader','attack_sword'),('ming','attack_fire')]:
    path=folder/f'child-{faction}-pawn-sample.glb';data=path.read_bytes()
    magic,version,total=struct.unpack_from('<III',data);assert (magic,version,total)==(0x46546c67,2,len(data))
    length,kind=struct.unpack_from('<II',data,12);assert kind==0x4e4f534a
    doc=json.loads(data[20:20+length]);bin_length,bin_type=struct.unpack_from('<II',data,20+length);assert bin_type==0x004e4942
    assert 28+length+bin_length==len(data)
    for view in doc.get('bufferViews',[]):assert 0<=view.get('byteOffset',0)<=view.get('byteOffset',0)+view['byteLength']<=bin_length
    for item in doc.get('buffers',[]):assert 'uri' not in item,'No remote model data'
    names={item.get('name') for item in doc['nodes']}
    assert {'Character','Body','Head','RightShoulder','LeftShoulder','Weapon','Shield'}<=names
    if faction=='ming':assert {'Muzzle','MuzzleFlash'}<=names
    assert len(doc['animations'])==1 and doc['animations'][0]['name']==clip
    assert len(doc['animations'][0]['channels'])>=2
    root=next(node for node in doc['nodes'] if node.get('name')=='Character')
    assert root['extras']['fidelityApproved'] is False
    assert root['extras']['status']=='rework-required'
    assert len(doc.get('images',[]))>=2 and len(doc.get('textures',[]))>=2,'Refined surfaces must survive GLB export'
    for image in doc['images']:assert 'bufferView' in image and 'uri' not in image,'Textures must be embedded'
    assert any('normalTexture' in item for item in doc['materials'])
    assert any('COLOR_0' in primitive['attributes'] for item in doc['meshes'] for primitive in item['primitives']),'Complexion missing from exported geometry'
    expected=next(sample for sample in report['samples'] if sample['role']==f'child-{faction}-p')
    assert expected['status']=='rework-required'
    assert hashlib.sha256(data).hexdigest()==expected['sha256']
    assert (folder/f'child-{faction}-pawn-sample.blend').stat().st_size>10000
    results.append({'role':expected['role'],'triangles':expected['triangles'],'bytes':len(data),'embeddedImages':len(doc['images']),'clip':clip,'sha256':expected['sha256']})
checks={'crusader':'8f23db2b8bd2b60e2be46b42f2bcde73405198f2978b6ef4ce7c3c2f1beefe97','ming':'5f02887bca9cb4a57d672ac4d8697bd3261f87ac66bfb71b3840b59bce7f3a4b'}
for faction,expected in checks.items():assert hashlib.sha256((folder/f'child-{faction}-pawn-v1.png').read_bytes()).hexdigest()==expected
(folder/'structural-check.json').write_text(json.dumps({'passed':True,'models':results,'referencesMatchLockedHashes':True,'fidelityApproved':False},indent=2),encoding='utf-8')
print(json.dumps({'passed':True,'models':results,'referencesMatchLockedHashes':True}))
