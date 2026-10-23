# 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司
"""Build two independently reviewable, articulated character samples in Blender.
Run with blender --background --python this_file -- --output /absolute/folder.
These are samples awaiting reference-fidelity approval, not final game assets.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import sys

import bpy
from mathutils import Vector

args=argparse.ArgumentParser()
args.add_argument('--output',required=True)
opts=args.parse_args(sys.argv[sys.argv.index('--')+1:])
out=Path(opts.output);out.mkdir(parents=True,exist_ok=True)

def material(name,color,metal=0,rough=.45,emission=False):
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    shader=mat.node_tree.nodes.get('Principled BSDF')
    rgb=[int(color[i:i+2],16)/255 for i in (0,2,4)]
    rgba=tuple(value/12.92 if value<=.04045 else ((value+.055)/1.055)**2.4 for value in rgb)+(1,)
    shader.inputs['Base Color'].default_value=rgba
    shader.inputs['Metallic'].default_value=metal
    shader.inputs['Roughness'].default_value=rough
    if emission:
        key='Emission Color' if 'Emission Color' in shader.inputs else 'Emission'
        shader.inputs[key].default_value=rgba
        if 'Emission Strength' in shader.inputs:shader.inputs['Emission Strength'].default_value=3
    return mat

def parent(obj,p):
    if p:
        bpy.context.view_layer.update()
        matrix=obj.matrix_world.copy();obj.parent=p;obj.matrix_world=matrix
    return obj

def empty(name,location=(0,0,0),p=None):
    obj=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(obj)
    obj.location=location;parent(obj,p);return obj

def finish(obj,name,mat,p=None,smooth=True):
    obj.name=name
    if mat:obj.data.materials.append(mat)
    if smooth and obj.type=='MESH':
        for face in obj.data.polygons:face.use_smooth=True
    return parent(obj,p)

def cube(name,loc,size,mat,p=None,bevel=.03):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    obj=bpy.context.object;obj.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        modifier=obj.modifiers.new('Rounded finished edges','BEVEL');modifier.width=bevel;modifier.segments=3
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        modifier=obj.modifiers.new('Weighted normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=modifier.name)
    return finish(obj,name,mat,p)

def sphere(name,loc,scale,mat,p=None,segments=24,rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=1,location=loc)
    obj=bpy.context.object;obj.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(obj,name,mat,p)

def cylinder(name,loc,radius,depth,mat,p=None,top=None,vertices=40):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=radius,radius2=radius if top is None else top,depth=depth,location=loc)
    return finish(bpy.context.object,name,mat,p)

def rod(name,a,b,radius,mat,p=None):
    a,b=Vector(a),Vector(b);obj=cylinder(name,(a+b)/2,radius,(b-a).length,mat,None,vertices=20)
    obj.rotation_mode='QUATERNION';obj.rotation_quaternion=(b-a).to_track_quat('Z','Y')
    return parent(obj,p)

def torus(name,loc,radius,tube,mat,p=None,rotation=(0,0,0),scale=(1,1,1),major=32,minor=8):
    bpy.ops.mesh.primitive_torus_add(major_segments=major,minor_segments=minor,location=loc,major_radius=radius,minor_radius=tube,rotation=rotation)
    obj=bpy.context.object;obj.scale=scale
    return finish(obj,name,mat,p)

def curve(name,points,thickness,mat,p=None):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=10
    data.bevel_depth=thickness;data.bevel_resolution=3
    spline=data.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
    for point,co in zip(spline.bezier_points,points):point.co=co;point.handle_left_type='AUTO';point.handle_right_type='AUTO'
    if name=='Swept red plume':
        for point,radius in zip(spline.bezier_points,[.65,1,.85,.55,.025]):point.radius=radius
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);parent(obj,p)
    obj.data.materials.append(mat)
    return obj

def mesh(name,verts,faces,mat,p=None):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
    return finish(obj,name,mat,p)

def shell(name,z0,z1,rx0,ry0,rx1,ry1,mat,p,start=0,end=math.tau,steps=64):
    cloth=any(word in name.lower() for word in ['torso','surcoat','skirt'])
    rows=16 if cloth else 1
    verts=[]
    for row in range(rows+1):
        t=row/rows;z=z0+(z1-z0)*t
        belly=math.sin(t*math.pi)*.055 if 'torso' in name.lower() else 0
        rx=rx0+(rx1-rx0)*t+belly;ry=ry0+(ry1-ry0)*t+belly*.7
        for i in range(steps+1):
            a=start+(end-start)*i/steps
            fold=(.018*math.cos(a*12+t*.7)+.009*math.cos(a*21-t))*(1-t*.65) if cloth else 0
            verts.append((math.sin(a)*(rx+fold),-math.cos(a)*(ry+fold),z))
    faces=[]
    for row in range(rows):
        for i in range(steps):
            n=row*(steps+1)+i;faces.append((n,n+1,n+steps+2,n+steps+1))
    return mesh(name,verts,faces,mat,p)

def surface_texture(mat,kind):
    # Tangent-space detail is packed into the GLB, so it survives browser export.
    import numpy as np
    size=512;y,x=np.mgrid[0:size,0:size]/size
    if kind=='cloth':
        height=.4*np.sin(x*math.tau*96)*np.cos(y*math.tau*96)+.15*np.sin(y*math.tau*192)
        strength=.09
    elif kind=='wood':
        height=np.sin(x*math.tau*18+.8*np.sin(y*math.tau*2))+.3*np.sin(x*math.tau*49+y*math.tau*3)
        strength=.12
    else:
        height=np.sin(x*math.tau*83)+.3*np.sin(x*math.tau*171+y*math.tau*2);strength=.025
    dy,dx=np.gradient(height)
    normal=np.stack((-dx*strength*10,-dy*strength*10,np.ones_like(x)),axis=-1)
    normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
    pixels=np.ones((size,size,4),dtype=np.float32);pixels[:,:,:3]=normal*.5+.5
    image=bpy.data.images.new(kind+' surface normal 512',width=size,height=size,alpha=False)
    image.colorspace_settings.name='Non-Color';image.pixels.foreach_set(pixels.ravel());image.pack()
    tree=mat.node_tree;tex=tree.nodes.new('ShaderNodeTexImage');tex.image=image
    mapping=tree.nodes.new('ShaderNodeNormalMap');mapping.inputs['Strength'].default_value=.12 if kind=='metal' else .25
    tree.links.new(tex.outputs['Color'],mapping.inputs['Color'])
    tree.links.new(mapping.outputs['Normal'],tree.nodes.get('Principled BSDF').inputs['Normal'])

def face_y(x,z):
    return -.015-.45*math.sqrt(max(.02,1-abs(x/.56)**(2/.82)-abs((z-2.46)/.53)**(2/.82)))

def face_patch(name,points,mat,p,depth=.009):
    cx=sum(x for x,z in points)/len(points);cz=sum(z for x,z in points)/len(points)
    verts=[(cx,face_y(cx,cz)-depth,cz)]+[(x,face_y(x,z)-depth,z) for x,z in points]
    return mesh(name,verts,[(0,i+1,(i+1)%len(points)+1) for i in range(len(points))],mat,p)


def cross(x,y,z,w,h,mat,p):
    cube('Raised gold cross upright',(x,y,z),(w*.25,.035,h),mat,p,.012)
    cube('Raised gold cross arms',(x,y,z+h*.14),(w,.035,h*.19),mat,p,.012)

def emblem_shape(name,points,y,depth,mat,p):
    count=len(points);verts=[(x,y+d,z) for d in [0,depth] for x,z in points]
    faces=[tuple(range(count-1,-1,-1)),tuple(range(count,2*count))]
    faces.extend((i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count))
    obj=mesh(name,verts,faces,mat,p)
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    modifier=obj.modifiers.new('Soft rim edges','BEVEL');modifier.width=.025;modifier.segments=3
    bpy.ops.object.modifier_apply(modifier=modifier.name);obj.select_set(False)
    return obj

def key(obj,frame,rotation=None,location=None,scale=None):
    if rotation is not None:obj.rotation_euler=rotation;obj.keyframe_insert('rotation_euler',frame=frame)
    if location is not None:obj.location=location;obj.keyframe_insert('location',frame=frame)
    if scale is not None:obj.scale=(scale,scale,scale);obj.keyframe_insert('scale',frame=frame)

def merge_static_parts():
    # Merge only siblings sharing a material; preserve independently animated joints.
    for obj in list(bpy.context.scene.objects):
        if obj.type=='CURVE':
            bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
    groups={}
    for obj in bpy.context.scene.objects:
        if obj.type=='MESH' and obj.data.materials:
            groups.setdefault((obj.parent,obj.data.materials[0]),[]).append(obj)
    for (p,mat),objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:obj.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:bpy.ops.object.join()
        bpy.context.object.name=(p.name if p else 'Character')+'__'+mat.name

def inspect_glb(path,clip):
    data=path.read_bytes();magic,version,total=struct.unpack_from('<III',data)
    assert magic==0x46546c67 and version==2 and total==len(data)
    size,kind=struct.unpack_from('<II',data,12);assert kind==0x4e4f534a
    doc=json.loads(data[20:20+size])
    # SCENE export is deliberately a single combined clip for all rigid joints.
    animations=doc.get('animations',[]);assert len(animations)==1,(len(animations),[a.get('name') for a in animations])
    animations[0]['name']=clip
    encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
    rest=data[20+size:];path.write_bytes(struct.pack('<III',magic,version,20+len(encoded)+len(rest))+struct.pack('<II',len(encoded),kind)+encoded+rest)
    triangle_count=0
    for item in doc.get('meshes',[]):
        for primitive in item['primitives']:
            assert primitive.get('mode',4)==4
            triangle_count+=doc['accessors'][primitive['indices']]['count']//3
    assert any(node.get('name')=='Muzzle' for node in doc['nodes']) if clip=='attack_fire' else True
    return {'nodes':len(doc['nodes']),'meshes':len(doc.get('meshes',[])),'triangles':triangle_count,'animation':clip,'channels':len(animations[0]['channels']),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}

def build(faction):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene;scene.render.fps=24;scene.frame_start=1;scene.frame_end=73
    white=faction=='crusader'
    mats={
        'mouth':material('Smile interior','552326',rough=.65),
        'tongue':material('Smile tongue','D87776',rough=.5),
        'skin':material('Warm porcelain skin','F2BD91',rough=.43),
        'cheek':material('Rosy cheeks','E7937E',rough=.65),
        'black':material('Ink eye and openings','171714',rough=.4),
        'eye':material('Eye catchlight','FFFDF6',rough=.2),
        'ivory':material('Ivory cotton surcoat','F3E6CB',rough=.8),
        'gold':material('Antique warm gold','E8B94E',.65,.29),
        'steel':material('Brushed warm steel','B6B9B9',.72,.32),
        'dark':material('Charcoal lacquered armor','242827',.35,.4),
        'mail':material('Chain mail rings','6E726E',.7,.4),
        'red':material('Ming vermilion cloth','BD3027',rough=.6),
        'plume':material('Crimson horsehair plume','DE302A',rough=.5),
        'leather':material('Brown leather','593B27',rough=.7),
        'wood':material('Polished walnut gun stock','653B20',rough=.45),
        'boot':material('Dark boots','25221D',rough=.5),
        'fire':material('Muzzle flash amber','FF9D19',rough=.5,emission=True),
        'core':material('Muzzle flash core','FFF2AD',rough=.5,emission=True),
    }
    for name,kind in [('ivory','cloth'),('red','cloth'),('wood','wood'),('steel','metal')]:surface_texture(mats[name],kind)
    root=empty('Character');root['role']='child-'+faction+'-p';root['fidelityApproved']=False
    root['status']='rework-required'
    body=empty('Body',(0,0,.2),root)
    head=empty('Head',(0,0,2.46),body)
    right=empty('RightShoulder',(-.46,0,1.79),body)
    left=empty('LeftShoulder',(.46,0,1.79),body)
    weapon=empty('Weapon',(-.67,-.20,1.58),right)
    shield=empty('Shield',(.70,-.26,1.35),left)

    cylinder('Base dark foot',(0,0,.06),.91,.12,mats['gold'] if white else mats['boot'],root)
    cylinder('Base middle',(0,0,.14),.88,.10,mats['ivory'] if white else mats['dark'],root)
    cylinder('Base colored rim',(0,0,.205),.88,.04,mats['gold'] if white else mats['red'],root)
    cylinder('Base top',(0,0,.235),.84,.025,mats['ivory'] if white else mats['leather'],root)
    if not white:
        cube('Base plate gold',(0,-.873,.13),(.65,.055,.20),mats['gold'],root,.035)
        cube('Base plate red',(0,-.909,.13),(.56,.018,.13),mats['red'],root,.022)

    for x in [-.24,.24]:
        cylinder('Leg',(x,.02,.66),.17,.54,mats['mail'] if white else mats['dark'],body)
        sphere('Rounded boot',(x,-.09,.37),(.225,.32,.16),mats['boot'],body)
        cube('Boot sole',(x,-.09,.29),(.43,.58,.065),mats['boot'],body,.028)
    cloth=mats['ivory'] if white else mats['red']
    shell('Tailored torso',.92,1.91,.47,.30,.38,.265,cloth,body)
    sphere('Shoulder cloth volume',(0,0,1.76),(.43,.27,.22),cloth,body)
    cylinder('Neck collar',(0,0,2.01),.21,.13,mats['leather'] if white else mats['red'],body)
    torus('Collar gold piping',(0,0,2.035),.215,.026,mats['gold'],body)
    # Layered, split cloth skirt; no generic cone replacing both factions' dress.
    for side in [-1,1]:
        start,end=(.06,math.pi) if side==1 else (math.pi,math.tau-.06)
        tail=shell('Flared split surcoat' if white else 'Flared red skirt',.72,1.25,.55,.35,.43,.29,cloth,body,start=start,end=end,steps=32)
        bpy.context.view_layer.objects.active=tail
        solid=tail.modifiers.new('Cloth thickness','SOLIDIFY');solid.thickness=.035;bpy.ops.object.modifier_apply(modifier=solid.name)
        if white:
            curve('Surcoat hem',[(math.sin(start+(end-start)*i/16)*.55,-math.cos(start+(end-start)*i/16)*.35,.73) for i in range(17)],.018,mats['gold'],body)
        else:
            for col in range(3):
                for row in range(3):
                    x=side*.245+(col-1)*.13;z=.79+row*.115
                    cube('Skirt lamella',(x,-.327,z),(.11,.038,.10),mats['dark'] if col!=1 else mats['red'],body,.012)
                    sphere('Skirt rivet',(x,-.354,z+.018),(.015,.008,.015),mats['gold'],body,12,8)

    for side in [-1,1]:
        for index in range(3):
            x=side*(.15+index*.095)
            curve('Tailored chest seam',[(x*.72,-.257,1.89),(x,-.330,1.62),(x*.97,-.332,1.27)],.007,cloth,body)

    # Belt encircles the body rather than floating as a straight chest strip.
    belt=shell('Leather belt',1.06,1.19,.515,.361,.505,.356,mats['leather'],body)
    for dx,dz,w,h in [(-.14,0,.035,.18),(.14,0,.035,.18),(0,.075,.28,.035),(0,-.075,.28,.035)]:
        cube('Belt buckle',(dx,-.385,1.13+dz),(w,.055,h),mats['gold'],body,.008)

    for side,joint in [(-1,right),(1,left)]:
        arm_top=(side*.48,0,1.79);arm_bottom=(side*.62,-.06,1.34)
        sleeve=rod('Chainmail sleeve' if white else 'Red sleeve',arm_top,arm_bottom,.17,mats['mail'] if white else mats['red'],joint)
        sphere('Shoulder cap',(side*.46,0,1.78),(.22,.25,.18),mats['mail'] if white else mats['dark'],joint)
        if white:
            for row in range(3):
                for col in range(9):
                    angle=col*math.tau/9+row*.17;z=1.76+row*.055
                    torus('Shoulder chain link',(side*.46+math.sin(angle)*.215,math.cos(angle)*.24,z),.034,.009,mats['steel'],joint,rotation=(math.pi/2,0,-angle),major=10,minor=4)
            for row in range(6):
                z=1.41+row*.069
                for col in range(8):
                    a=col*math.tau/8+row*.12;t=(1.79-z)/.45;x=side*(.48+t*.14)
                    torus('Sleeve chain link',(x+math.sin(a)*.18,-t*.06+math.cos(a)*.18,z),.037,.009,mats['steel'],joint,rotation=(math.pi/2,0,-a),major=10,minor=4)
            cuff=rod('Glove cuff',(side*.61,-.06,1.40),(side*.635,-.09,1.30),.18,mats['leather'],joint)
        else:
            for stripe in range(3):
                cube('Shoulder gold lamella',(side*(.46+stripe*.06),-.19,1.82-stripe*.065),(.12,.045,.12),mats['gold'],joint,.02)
        sphere('Gloved palm' if white else 'Hand',(side*.65,-.15,1.32),(.16,.14,.18),mats['leather'] if white else mats['skin'],joint)
        for finger in range(3):
            sphere('Finger',(side*.68,-.263,1.22+finger*.075),(.105,.05,.038),mats['leather'] if white else mats['skin'],joint,16,10)

    # Continuous rounded cheeks and chin, following the approved open-smile face.
    face=sphere('Rounded child face',(0,-.015,2.46),(.56,.45,.53),mats['skin'],head,64,40)
    for vert in face.data.vertices:
        vert.co.x=math.copysign(.56*abs(vert.co.x/.56)**.82,vert.co.x)
        vert.co.z=math.copysign(.53*abs(vert.co.z/.53)**.82,vert.co.z)
    colors=face.data.color_attributes.new(name='Complexion',type='FLOAT_COLOR',domain='POINT')
    for vert,color in zip(face.data.vertices,colors.data):
        x,y,z=vert.co;warm=0
        if y<0:
            warm=max(math.exp(-(((x-s*.32)/.105)**2+((z+.14)/.085)**2)*1.5) for s in [-1,1])
        base=mats['skin'].node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value
        color.color=(base[0],base[1]*(1-warm*.23),base[2]*(1-warm*.18),1)
    tree=mats['skin'].node_tree;vertex=tree.nodes.new('ShaderNodeVertexColor');vertex.layer_name='Complexion'
    tree.links.new(vertex.outputs['Color'],tree.nodes.get('Principled BSDF').inputs['Base Color'])
    for side in [-1,1]:
        x=side*.205;z=2.51;y=face_y(x,z)
        sphere('Glossy oval eye',(x,y-.020,z),(.083,.040,.116),mats['black'],head,32,20)
        sphere('Main eye catchlight',(x-.021,y-.057,z+.043),(.026,.012,.030),mats['eye'],head,20,12)
        sphere('Small eye catchlight',(x+.022,y-.058,z-.028),(.011,.006,.012),mats['eye'],head,16,8)
        points=[(x-.085,2.69),(x-.012,2.715),(x+.073,2.695)]
        curve('Friendly arched brow',[(px,face_y(px,pz)-.014,pz) for px,pz in points],.020,mats['leather'],head)
    sphere('Rounded nose',(0,face_y(0,2.37)-.018,2.37),(.046,.041,.037),mats['skin'],head)
    mouth=[(-.135,2.275),(-.075,2.265),(0,2.26),(.075,2.265),(.135,2.275),(.111,2.20),(.075,2.155),(0,2.137),(-.075,2.155),(-.111,2.20)]
    face_patch('Open smiling mouth',mouth,mats['mouth'],head)
    face_patch('Upper smile teeth',[(-.113,2.265),(0,2.251),(.113,2.265),(.094,2.235),(0,2.226),(-.094,2.235)],mats['eye'],head,.014)
    face_patch('Small rosy tongue',[(-.062,2.162),(-.043,2.181),(0,2.186),(.043,2.181),(.062,2.162),(0,2.147)],mats['tongue'],head,.015)

    if white:
        cross(0,-.309,1.58,.36,.42,mats['gold'],body)
        # Bucket helmet and separate cheek/back plates leave the approved face opening.
        shell('Bucket helmet upper',2.80,3.27,.64,.52,.59,.49,mats['steel'],head)
        cylinder('Helmet top',(0,0,3.275),.595,.035,mats['steel'],head)
        shell('Helmet cheek and rear plates',2.12,2.83,.68,.55,.64,.52,mats['steel'],head,start=math.radians(58),end=math.radians(302),steps=56)
        shell('Gold helmet brow',2.79,2.87,.65,.535,.645,.533,mats['gold'],head)
        cube('Vertical helmet gold cross',(0,-.548,2.99),(.135,.043,.64),mats['gold'],head,.018)
        for z in [2.98,3.12]:
            sphere('Gold cross rivet',(0,-.58,z),(.028,.012,.028),mats['gold'],head,16,8)
        for z in [2.28,2.43,2.58,2.99,3.12]:
            for deg in range(70,301,24):
                a=math.radians(deg);rx=.675 if z<2.8 else .62;ry=.55 if z<2.8 else .515
                point=Vector((math.sin(a)*rx,-math.cos(a)*ry,z));normal=Vector((math.sin(a)/rx,-math.cos(a)/ry,0)).normalized()
                opening=sphere('Recessed helmet ventilation',point,(.017,.004,.022),mats['black'],None,16,10)
                opening.rotation_mode='QUATERNION';opening.rotation_quaternion=normal.to_track_quat('Y','Z');parent(opening,head)
        for x in [-.22,.22]:
            for row in range(5):
                for col in range(6):
                    torus('Leg chain link',(x+(col-2.5)*.054,-.15,.51+row*.055),.027,.007,mats['steel'],body,rotation=(math.pi/2,0,0),major=10,minor=4)
        # Kite shield with actual depth, raised border and cross.
        points=[(.39,1.83),(1.02,1.83),(1.10,1.64),(.99,1.05),(.72,.72),(.44,1.05),(.32,1.64)]
        emblem_shape('Gold kite shield',points,-.41,.09,mats['gold'],shield)
        center=(.71,1.36);inner=[(center[0]+(x-center[0])*.85,center[1]+(z-center[1])*.86) for x,z in points]
        emblem_shape('Ivory shield face',inner,-.445,.03,mats['ivory'],shield)
        cross(.71,-.49,1.40,.35,.59,mats['gold'],shield)
        # Pointed diamond-section sword, rounded grip and distinct guard.
        rod('Sword grip',(-.73,-.20,1.20),(-.80,-.20,1.52),.064,mats['leather'],weapon)
        sphere('Sword pommel',(-.72,-.20,1.15),(.09,.08,.08),mats['gold'],weapon)
        guard=cube('Sword crossguard',(-.81,-.20,1.55),(.47,.13,.09),mats['gold'],weapon,.035);guard.rotation_euler.y=-.16
        blade=[(-.96,-.20,1.61),(-.71,-.20,1.61),(-1.08,-.20,2.49),(-.835,-.26,1.65),(-1.04,-.235,2.34),(-.835,-.14,1.65)]
        blade_obj=mesh('Faceted sword blade',blade,[(0,3,4,2),(3,1,2,4),(0,2,4,5),(1,5,4,2),(0,5,1,3)],mats['steel'],weapon)
        for polygon in blade_obj.data.polygons:polygon.use_smooth=False
        clip='attack_sword'
        for frame,rot in [(1,(0,0,0)),(18,(0,-.65,-.30)),(34,(.15,.85,.20)),(46,(.12,.38,.05)),(73,(0,0,0))]:key(right,frame,rotation=rot)
        for frame,rot in [(1,(0,0,0)),(18,(.18,-.12,-.18)),(34,(.22,-.20,-.18)),(73,(0,0,0))]:key(left,frame,rotation=rot)
    else:
        # Black lamellar armor and gold rivets over vermilion cloth, front and rear.
        for back in [False,True]:
            for row in range(5):
                for col in range(6):
                    x=(col-2.5)*.135;z=1.30+row*.112;y=(.282 if back else -.292)+abs(x)*(.02 if back else -.02)
                    cube('Black lamellar chest plate',(x,y,z),(.12,.035,.102),mats['dark'],body,.012)
                    sphere('Gold armor rivet',(x,y+(.026 if back else -.026),z+.013),(.019,.01,.019),mats['gold'],body,12,8)
        shell('Helmet leather neck guard',2.04,2.77,.58,.49,.57,.47,mats['dark'],head,start=math.radians(64),end=math.radians(296),steps=40)
        for deg in range(70,291,28):
            a=math.radians(deg);curve('Neck guard seam',[(math.sin(a)*.58,-math.cos(a)*.49,2.10),(math.sin(a)*.59,-math.cos(a)*.50,2.45),(math.sin(a)*.57,-math.cos(a)*.48,2.73)],.012,mats['boot'],head)
        hat=cylinder('Conical Ming helmet',(0,0,3.02),.86,.58,mats['dark'],head,top=.16,vertices=64)
        torus('Gold hat rim',(0,0,2.73),.856,.025,mats['gold'],head)
        for deg in range(0,360,60):
            a=math.radians(deg);curve('Hat panel seam',[(math.sin(a)*.85,-math.cos(a)*.85,2.74),(math.sin(a)*.49,-math.cos(a)*.49,3.04),(math.sin(a)*.17,-math.cos(a)*.17,3.30)],.009,mats['boot'],head)
        cylinder('Plume socket',(0,0,3.35),.17,.09,mats['gold'],head,top=.13)
        for index in range(5):
            x=(index-2)*.042
            curve('Swept red plume',[(x,0,3.39),(x,-.03,3.70),(x,.22,3.77),(x,.46,3.48),(x,.67,3.44)],.055,mats['plume'],head)
        badge=cylinder('Helmet badge',(0,-.608,3.01),.115,.035,mats['gold'],None);badge.rotation_euler.x=math.pi/2;parent(badge,head)
        curve('Badge relief',[(-.05,-.637,3.04),(0,-.655,3.08),(.05,-.637,3.04),(0,-.66,3.00),(-.04,-.637,2.96)],.014,mats['gold'],head)
        # Rectangular lacquered shield with dimensional gold dragon ornament.
        cube('Shield gold rim',(.74,-.40,1.35),(.68,.10,1.15),mats['gold'],shield,.05)
        cube('Shield black face',(.74,-.464,1.35),(.58,.035,1.04),mats['dark'],shield,.04)
        for x in [.49,.99]:
            for z in [.89,1.81]:sphere('Shield corner rivet',(x,-.502,z),(.027,.012,.027),mats['gold'],shield,16,8)
        curve('Dragon raised body',[(.69,-.51,.99),(.84,-.52,1.11),(.65,-.52,1.30),(.83,-.52,1.49),(.70,-.52,1.66)],.035,mats['gold'],shield)
        sphere('Dragon head',(.70,-.53,1.67),(.073,.032,.055),mats['gold'],shield)
        for side in [-1,1]:
            for z in [1.19,1.47]:
                curve('Dragon claws',[(.73,-.525,z),(.73+side*.12,-.525,z+.055),(.73+side*.15,-.525,z+.13)],.017,mats['gold'],shield)
            curve('Dragon horns',[(.70,-.535,1.69),(.70+side*.07,-.535,1.76),(.70+side*.09,-.535,1.80)],.014,mats['gold'],shield)
        sphere('Dragon brow',(.685,-.564,1.69),(.072,.020,.022),mats['gold'],shield)
        sphere('Dragon snout',(.643,-.551,1.655),(.055,.030,.024),mats['gold'],shield)
        sphere('Dragon eye',(.665,-.584,1.688),(.009,.007,.009),mats['black'],shield,16,8)
        curve('Dragon lower jaw',[(.70,-.554,1.65),(.655,-.558,1.625),(.62,-.555,1.64)],.013,mats['gold'],shield)
        for side in [-1,1]:
            curve('Dragon flowing whisker',[(.65,-.56,1.65),(.65+side*.08,-.555,1.61),(.65+side*.10,-.55,1.69)],.007,mats['gold'],shield)
            for z in [1.19,1.47]:
                for finger in [-1,0,1]:
                    curve('Dragon spread talon',[(.73+side*.12,-.546,z+.055),(.73+side*(.16+finger*.018),-.547,z+.085),(.73+side*(.17+finger*.025),-.547,z+.12+finger*.024)],.008,mats['gold'],shield)
        for index in range(15):
            t=index/14;z=1.03+t*.57;x=.745+.075*math.sin(t*math.tau*1.6)
            sphere('Dragon raised scale',(x,-.557,z),(.020,.011,.014),mats['gold'],shield,12,8)
        # Short hand cannon with a real open muzzle and a separate recoil pivot.
        rear=Vector((-.68,-.12,1.66));front=Vector((-.68,-.98,1.92));axis=(front-rear).normalized()
        rod('Walnut barrel body',rear,front,.115,mats['wood'],weapon)
        for fraction in [.08,.40,.77,.98]:
            point=rear.lerp(front,fraction);band=torus('Gun brass barrel band',point,.117,.018,mats['gold'],None)
            band.rotation_mode='QUATERNION';band.rotation_quaternion=axis.to_track_quat('Z','Y');parent(band,weapon)
        muzzle=empty('Muzzle',front,weapon);muzzle.rotation_mode='QUATERNION';muzzle.rotation_quaternion=axis.to_track_quat('Z','Y')
        opening=cylinder('Dark barrel bore',front+axis*.008,.089,.012,mats['black'],None)
        opening.rotation_mode='QUATERNION';opening.rotation_quaternion=axis.to_track_quat('Z','Y');parent(opening,weapon)
        rod('Gun hand grip',rear+Vector((0,0,-.04)),rear+Vector((0,.06,-.30)),.07,mats['wood'],weapon)
        torus('Trigger guard',rear+Vector((0,-.11,-.15)),.065,.012,mats['gold'],weapon,rotation=(0,math.pi/2,0))
        # Holstered sabre remains a separate prop, not an invented second gun.
        rod('Sabre scabbard',(-.42,.02,1.13),(-.67,.12,.54),.065,mats['leather'],body)
        sphere('Sabre gold tip',(-.67,.12,.54),(.075,.07,.07),mats['gold'],body)
        rod('Sabre hilt',(-.42,.02,1.13),(-.35,-.01,1.28),.048,mats['gold'],body)
        flash=empty('MuzzleFlash',front,weapon)
        tangent=Vector((1,0,0));bitangent=axis.cross(tangent).normalized()
        for radius,length,mat in [(.19,.34,mats['fire']),(.095,.28,mats['core'])]:
            verts=[tuple(front+axis*.012)]
            for i in range(12):
                angle=i*math.tau/12;size=radius if i%2==0 else radius*.35
                verts.append(tuple(front+axis*.075+(tangent*math.cos(angle)+bitangent*math.sin(angle))*size))
            verts.append(tuple(front+axis*length))
            faces=[]
            for i in range(12):
                a,b=i+1,(i+1)%12+1;faces.extend([(0,b,a),(a,b,13)])
            mesh('Jagged muzzle flame',verts,faces,mat,flash)
        clip='attack_fire'
        for frame,rot in [(1,(0,0,0)),(18,(.12,0,0)),(30,(.12,0,0)),(33,(-.08,0,.05)),(42,(.10,0,0)),(73,(0,0,0))]:key(right,frame,rotation=rot)
        for frame,size in [(1,.00001),(29,.00001),(30,1),(32,.70),(34,.00001),(73,.00001)]:key(flash,frame,scale=size)

    # Preserve editable source, joint names and the exact pending-approval status.
    scene.frame_set(1)
    # Shorter torso/legs restore the turnaround's chibi proportion; props keep their shape.
    body.scale.z=.84
    for joint in [head,right,left]:joint.scale.z=1/.84
    for obj in list(scene.objects):
        if obj.type=='MESH' and mats['skin'] in list(obj.data.materials) and not obj.data.color_attributes.get('Complexion'):
            colors=obj.data.color_attributes.new(name='Complexion',type='FLOAT_COLOR',domain='POINT')
            base=mats['skin'].node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value
            for color in colors.data:color.color=base
    merge_static_parts()
    for obj in list(scene.objects):
        if obj.type=='MESH' and any(m.use_nodes and any(n.type=='TEX_IMAGE' for n in m.node_tree.nodes) for m in obj.data.materials):
            bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
            bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.wm.save_as_mainfile(filepath=str(out/f'child-{faction}-pawn-sample.blend'))
    bpy.ops.object.select_all(action='SELECT')
    props=bpy.ops.export_scene.gltf.get_rna_type().properties
    kwargs={'filepath':str(out/f'child-{faction}-pawn-sample.glb'),'export_format':'GLB','use_selection':True,'export_extras':True,'export_animations':True,'export_frame_range':True,'export_force_sampling':True,'export_apply':True,'export_yup':True}
    if 'export_animation_mode' in props:kwargs['export_animation_mode']='SCENE'
    if 'export_anim_scene_split_object' in props:kwargs['export_anim_scene_split_object']=False
    bpy.ops.export_scene.gltf(**kwargs)
    result=inspect_glb(out/f'child-{faction}-pawn-sample.glb',clip)
    result.update({'role':'child-'+faction+'-p','fidelityApproved':False,'status':'rework-required','binding':'rigid articulated object hierarchy; no deforming skin weights'})
    print('SAMPLE_RESULT',json.dumps(result),flush=True)
    return result

report={'samples':[build('crusader'),build('ming')],'blender':bpy.app.version_string,'approval':'rework-required','revision':'reference-refinement-r2','note':'Rounded complexion, open smile, folded cloth, embedded surface normals and dragon relief revised. Still rigid animation samples pending visual approval, not final game assets.'}
(out/'sample-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
assert all(sample['triangles']>1000 and sample['channels']>0 for sample in report['samples'])
print('Both editable and animated GLB samples exported.',flush=True)
