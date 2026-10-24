/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 */
import * as T from './vendor/three/three.module.js';
import {RoomEnvironment} from './vendor/three/examples/jsm/environments/RoomEnvironment.js';
import {GLTFLoader} from './vendor/three/examples/jsm/loaders/GLTFLoader.js';
const characterTemplates=new Map();let characterLoad;
// Geometry and textures are shared across all instances and boards.
export function preloadCharacters(onProgress=()=>{}){
 if(characterTemplates.size===12)return Promise.resolve();
 if(!characterLoad)characterLoad=(async()=>{
  const loader=new GLTFLoader();
  for(const camp of ['crusader','ming'])for(const role of ['p','r','n','b','q','k']){
   const key=camp+role;if(characterTemplates.has(key))continue;
   const model=(await loader.loadAsync(new URL('./assets/models/child-'+camp+'-'+role+'-budget50.glb',import.meta.url).href)).scene;
   model.updateMatrixWorld(true);
   const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
   if(!(size.y>0))throw Error('角色模型尺寸无效：'+key);
   const ming=camp==='ming';
   const height=(ming?{p:1.05,r:1.05,n:1.25,b:1.3,q:1.3,k:1.35}:{p:1.05,r:1.05,n:1.35,b:1.3,q:1.4,k:1.45})[role];
   // Ming robes and cannon barrels extend beyond the body; the old cap shrank the queen to pawn height.
   const scale=Math.min(height/size.y,(ming?1.15:.88)/Math.max(size.x,size.z));
   model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
   const template=new T.Group();template.rotation.y=camp==='crusader'?Math.PI:0;template.add(model);
   template.userData.asset=key;characterTemplates.set(key,template);
   onProgress(characterTemplates.size,12);
  }
 })().catch(error=>{characterLoad=null;throw error;});
 return characterLoad;
}
// Existing pawn preview remains compatible with the full roster.
export const preloadPawn=preloadCharacters;

const roles={p:'兵',r:'车',n:'马',b:'象',q:'后',k:'王'};
const place=i=>new T.Vector3(i%8-3.5,.12,3.5-Math.floor(i/8));
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createScene(wrap,getOptions,onLost){
 const stage=document.createElement('div');stage.className='chess3d-stage';
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setClearColor(0xf4e7ce);
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
 renderer.toneMappingExposure=.85;
 const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('role','group');
 canvas.setAttribute('aria-label','立体棋盘。方向键选格，回车走棋；拖动旋转视角。');stage.append(canvas);wrap.append(stage);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(40,1,.1,80);
 scene.add(new T.HemisphereLight(0xfff8f0,0x75624f,.8));
 const sun=new T.DirectionalLight(0xfffaf4,1.4);sun.position.set(-3,10,6);scene.add(sun);
 const fill=new T.DirectionalLight(0xffffff,.45);fill.position.set(5,4,-5);scene.add(fill);
 const resources=new Set(),materials=new Map(),templates=new Map();
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.55;resources.add(environment);room.dispose();pmrem.dispose();
 function material(color,metalness=0){const key=color+':'+metalness;if(!materials.has(key)){const m=new T.MeshStandardMaterial({color,metalness,roughness:metalness?.38:.75});materials.set(key,m);resources.add(m);}return materials.get(key);}
 function mesh(parent,geometry,color,x,y,z,scale,metal=0){resources.add(geometry);const m=new T.Mesh(geometry,material(color,metal));m.position.set(x,y,z);if(scale)m.scale.set(...scale);parent.add(m);return m;}
 function box(g,c,x,y,z,sx,sy,sz){return mesh(g,new T.BoxGeometry(sx,sy,sz),c,x,y,z);}
 function ball(g,c,x,y,z,sx,sy=sx,sz=sx){return mesh(g,new T.SphereGeometry(1,12,8),c,x,y,z,[sx,sy,sz]);}
 function cylinder(g,c,x,y,z,top,bottom,h,metal=0){return mesh(g,new T.CylinderGeometry(top,bottom,h,12),c,x,y,z,null,metal);}
 function rod(g,c,a,b,r=.025){const start=new T.Vector3(...a),end=new T.Vector3(...b),d=end.clone().sub(start);const m=cylinder(g,c,0,0,0,r,r,d.length());m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 function cross(g,x,y,z,size=.18){box(g,0xd5a94e,x,y,z,size*.28,size,.018);box(g,0xd5a94e,x,y+size*.15,z,size*.8,size*.24,.018);}
 function character(type,color,adult){
  if(!adult){const template=characterTemplates.get((color==='w'?'crusader':'ming')+type);if(template)return template.clone(true);}
  const key=type+color+adult;if(templates.has(key))return templates.get(key).clone(true);
  const g=new T.Group(),west=color==='w',cloth=west?0xeee2c6:0x982b2d,armor=west?0x8f9eac:0x242c35,gold=0xd9ab52,skin=0xedbf95;
  cylinder(g,west?0xd0ad66:0x763c32,0,.035,0,.31,.34,.07,.3);
  if(type==='r'){
   if(west){box(g,0x9ba4ac,0,.35,0,.48,.6,.48);box(g,0x424c59,0,.19,.248,.15,.25,.012);for(const x of [-.19,0,.19])for(const z of [-.19,.19])box(g,0xaeb6bc,x,.71,z,.12,.14,.12);cross(g,0,.46,.25,.21);rod(g,gold,[0,.72,0],[0,1.02,0]);box(g,cloth,.12,.93,0,.24,.13,.025);cross(g,.12,.93,.016,.09);}
   else{box(g,0x3b2922,0,.15,0,.4,.12,.52);const barrel=cylinder(g,0x9a3931,0,.39,0,.12,.16,.64,.6);barrel.rotation.x=Math.PI/2;for(const x of [-.26,.26]){const wheel=cylinder(g,0x593929,x,.19,0,.2,.2,.09);wheel.rotation.z=Math.PI/2;ball(g,gold,x*1.2,.19,0,.045);}rod(g,gold,[-.19,.16,-.1],[.19,.16,-.1]);}
  }else{
   const mounted=type==='n',height=adult?.78:.62,head=adult?.115:.17,base=mounted?.43:0;
   if(mounted){ball(g,west?0xbdb5a6:0x77492d,0,.4,0,.21,.22,.36);for(const x of [-.13,.13])for(const z of [-.23,.23])rod(g,0x76604b,[x,.35,z],[x,.1,z],.045);ball(g,west?0xcec5b1:0x845839,0,.64,.27,.13,.21,.15);box(g,cloth,0,.51,0,.43,.05,.35);for(const x of [-.06,.06])mesh(g,new T.ConeGeometry(.035,.14,6),armor,x,.85,.28);}
   const torso=new T.Group();torso.name='torso';torso.position.y=base;g.add(torso);
   for(const x of [-.085,.085]){box(torso,0x31343d,x,.16,0,.105,.22,.12);box(torso,0x40312a,x,.065,.025,.13,.08,.19);}
   cylinder(torso,cloth,0,.34,0,.14,.22,.36);
   box(torso,gold,0,.29,.15,.31,.04,.03);
   if(west)cross(torso,0,.41,.155,.17);else{box(torso,armor,0,.43,.15,.24,.22,.04);for(let j=0;j<3;j++)box(torso,gold,0,.35+j*.065,.175,.22,.012,.01);}
   const cape=box(torso,west?0x354963:0x641f25,0,.41,-.15,.34,.42,.05);cape.rotation.x=-.14;
   for(const x of [-.19,.19]){rod(torso,cloth,[x*.8,.48,0],[x,.25,.03],adult?.045:.06);ball(torso,skin,x,.23,.05,.05);}
   const face=new T.Group();face.name='face';face.position.set(0,height,0);torso.add(face);
   ball(face,skin,0,0,0,head,head*1.05,head*.85);
   for(const x of [-head*.4,head*.4])ball(face,0x212833,x,.015,head*.81,.017,.025,.01);
   const mouth=box(face,0x864d40,0,-head*.4,head*.85,.065,.012,.01);mouth.name='mouth';
   for(const x of [-head*.4,head*.4]){const brow=box(face,armor,x,.065,head*.78,.048,.012,.015);brow.name='brow';}
   if(type==='p'||type==='n'){
    if(west){cylinder(face,armor,0,head*.45,0,head*1.05,head*1.05,head*.9,.6);box(face,armor,0,-.015,.03,head*2.1,.035,head*1.8);}
    else{mesh(face,new T.ConeGeometry(head*1.25,head*1.3,12),armor,0,head*.8,0);ball(face,0xb9322e,0,head*1.6,-.035,.045,.12,.05);}
   }else if(type==='b'&&west){mesh(face,new T.ConeGeometry(head*.95,head*2,4),cloth,0,head*1.25,0);cross(face,0,head*1.3,head*.7,.1);}
   else if(type==='b'){box(face,armor,0,head*.8,0,head*2.1,.1,head*1.6);box(face,armor,0,head*.75,0,head*4,.04,.09);mesh(face,new T.ConeGeometry(.06,.17,6),armor,0,-head*.9,.04).rotation.z=Math.PI;}
   else if(!west&&type==='k'){box(face,armor,0,head*.9,0,head*2.1,.16,head*1.5);box(face,armor,0,head*1.8,-.025,head*1.8,.13,.07);box(torso,gold,0,.42,.18,.07,.17,.025);}
   else{cylinder(face,gold,0,head*.9,0,head*1.03,head*1.03,.06,.6);for(let j=0;j<6;j++){const a=j*Math.PI/3;mesh(face,new T.ConeGeometry(.025,.1,5),gold,Math.sin(a)*head,head*1.5,Math.cos(a)*head);}if(west&&type==='k')cross(face,0,head*2,.015,.12);}
   if(west){
    if(type==='p'){const shield=mesh(torso,new T.ConeGeometry(.14,.3,4),cloth,-.24,.31,.13);shield.rotation.z=Math.PI;shield.scale.z=.25;cross(torso,-.24,.33,.18,.13);}
    if(type==='b'){rod(torso,gold,[.25,.12,0],[.25,.9,0]);const crook=mesh(torso,new T.TorusGeometry(.065,.018,5,12,Math.PI*1.65),gold,.25,.91,0);crook.rotation.z=-.5;box(torso,0x544030,-.23,.3,.09,.14,.16,.05);}
    else if(type==='q'){rod(torso,gold,[.24,.22,0],[.24,.85,0]);ball(torso,gold,.24,.88,0,.055);}
    else rod(torso,type==='n'?0xc3a66e:0xcbd5db,[.23,.2,0],[.23,type==='n'?1.25:.74,0],type==='n'?.02:.025);
   }else{
    if(type==='p'||type==='n'){rod(torso,0x39322d,[.23,.17,.04],[.23,.8,.04],.04);box(torso,0x5d3724,.23,.22,.04,.08,.18,.08);}
    else if(type==='q'){const fan=mesh(torso,new T.CircleGeometry(.17,10,0,Math.PI),gold,.22,.35,.16);fan.material=material(gold);fan.material.side=T.DoubleSide;}
    else box(torso,type==='k'?0xc0cfaa:0xe4d8b8,.18,.35,.14,.07,.29,.035);
   }
  }
  g.rotation.y=west?Math.PI:0;g.scale.setScalar(adult?1:1.04);
  templates.set(key,g);return g.clone(true);
 }
 const squares=[],pieces=new T.Group();scene.add(pieces);
 const board=new T.Group();scene.add(board);box(board,0x684631,0,-.15,0,8.8,.4,8.8);box(board,0xba925a,0,.015,0,8.35,.08,8.35);
 for(let i=0;i<64;i++){const pos=place(i),color=(i%8+Math.floor(i/8))%2?0xf2eee4:0x4b4f52;const sq=box(board,color,pos.x,.07,pos.z,.98,.08,.98);sq.userData.index=i;sq.userData.color=color;squares.push(sq);}
 const cursor=mesh(scene,new T.TorusGeometry(.39,.025,5,24),0xe6b453,0,.14,0);cursor.rotation.x=-Math.PI/2;cursor.visible=false;
 const ray=new T.Raycaster(),pointer=new T.Vector2();let current=[],nodes=[],opts={},skin='',angle=0,elevation=1.02,zoomed=false,flipped=false,frame=0,animation=null,disposed=false,keyIndex=12;
 function cameraPosition(){
  const detail=zoomed&&wrap.id==='reviewBoard',move=animation?[animation.from,animation.to]:opts.lastMove;
  const target=detail?(move?place(move[0]).lerp(place(move[1]),.5):place(keyIndex)):new T.Vector3(0,.1,0);
  if(detail)target.y=.65;
  const radius=detail?5.2:zoomed?11.9:14.8;
  camera.position.set(target.x+Math.sin(angle)*Math.cos(elevation)*radius,target.y+Math.sin(elevation)*radius,target.z+Math.cos(angle)*Math.cos(elevation)*radius);camera.lookAt(target);
 }
 function draw(){if(!disposed&&!document.hidden&&wrap.offsetWidth){cameraPosition();renderer.render(scene,camera);}}
 const renderSize=new T.Vector2();
 function resize(){
  if(disposed)return;const w=wrap.clientWidth,h=wrap.clientHeight||w;if(!w||!h)return;
  // Keep iPhone native pixel density while bounding large-canvas GPU memory.
  const ratio=Math.min(devicePixelRatio||1,3,Math.sqrt(2500000/(w*h)));
  renderer.getSize(renderSize);if(renderSize.x===w&&renderSize.y===h&&renderer.getPixelRatio()===ratio)return;
  if(renderer.getPixelRatio()!==ratio)renderer.setPixelRatio(ratio);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();draw();
 }
 const observer=new ResizeObserver(resize);observer.observe(wrap);window.addEventListener('resize',resize);
 function reset(){angle=flipped?Math.PI:0;elevation=1.02;zoomed=false;draw();}
 function highlight(options){opts=options;for(let i=0;i<64;i++){const c=i===opts.selected?0xe2ac48:opts.captureSet?.has(i)?0xc46b55:opts.selectable?.has(i)?0xd8bc7d:opts.lastMove?.includes(i)?0xc49a52:squares[i].userData.color;squares[i].material=material(c);}draw();}
 function stop(){cancelAnimationFrame(frame);frame=0;animation=null;}
 function rebuild(){pieces.clear();nodes=[];const adult=window.__chessSkinMode==='adult';for(let i=0;i<64;i++){const p=current[i];if(!p)continue;const g=character(p.t,p.c,adult);g.position.copy(place(i));g.userData={...g.userData,index:i};nodes[i]=g;pieces.add(g);}}
 function emotion(node,phase,losing=false){if(!node)return;const face=node.getObjectByName('face');if(face){face.rotation.z=Math.sin(phase*Math.PI)*(losing?-.25:.13);const mouth=face.getObjectByName('mouth');if(mouth)mouth.scale.y=1+Math.sin(phase*Math.PI)*(losing?4:1);}}
 function animate(from,to,move={}){
  stop();if(reduced()||!nodes[from])return false;
  const mover=nodes[from],start=place(from),end=place(to),color=current[from].c;
  const victimIndex=move.ep?to+(color==='w'?-8:8):to,victim=nodes[victimIndex];
  const rook=move.castle?nodes[to>from?from+3:from-4]:null,rookFrom=rook?.position.clone(),rookTo=place(to>from?to-1:to+1);
  const duration=Number.isFinite(move.duration)?T.MathUtils.clamp(move.duration,200,10000):380;
  let begun=performance.now(),elapsed=0;
  animation={from,to,paused:false,
   pause(){cancelAnimationFrame(frame);frame=0;elapsed=T.MathUtils.clamp(performance.now()-begun,0,duration);this.paused=true;return true;},
   resume(){begun=performance.now()-elapsed;this.paused=false;frame=requestAnimationFrame(tick);return duration-elapsed;}
  };
  function tick(now){
   if(disposed||!animation||animation.paused)return;const t=Math.min(1,(now-begun)/duration),ease=t*t*(3-2*t);
   mover.position.lerpVectors(start,end,ease);mover.position.y+=Math.sin(t*Math.PI)*(current[from].t==='n'?.48:.12);emotion(mover,t);
   if(victim&&victim!==mover){victim.position.y=.12-.6*ease;victim.scale.setScalar(Math.max(.02,1-ease));emotion(victim,t,true);}
   if(rook)rook.position.lerpVectors(rookFrom,rookTo,ease);
   draw();if(t<1)frame=requestAnimationFrame(tick);else{animation=null;frame=0;draw();}
  }frame=requestAnimationFrame(tick);return true;
 }
 function update(boardState,options,instant=false){
  const previous=current;const changed=JSON.stringify(previous)!==JSON.stringify(boardState),nextSkin=window.__chessSkinMode;
  if(stage.parentNode!==wrap)wrap.append(stage);
  if(flipped!==!!options.flip){flipped=!!options.flip;reset();}
  if(changed||instant||skin!==nextSkin){stop();current=boardState||[];skin=nextSkin;rebuild();
   const m=options.lastMove;if(wrap.id!=='reviewBoard'&&changed&&!instant&&m&&previous[m[0]]&&!current[m[0]]&&current[m[1]]?.c===previous[m[0]].c){
    // Live state is already authoritative; animate its visual transition only.
    const mover=nodes[m[1]],from=place(m[0]),to=place(m[1]),begun=performance.now(),p=previous[m[0]],castle=p.t==='k'&&Math.abs(m[1]-m[0])===2;
    const rook=castle?nodes[m[1]>m[0]?m[1]-1:m[1]+1]:null,rookFrom=castle?place(m[1]>m[0]?m[0]+3:m[0]-4):null,rookTo=rook?.position.clone();
    const capIndex=p.t==='p'&&!previous[m[1]]&&m[0]%8!==m[1]%8?m[1]+(p.c==='w'?-8:8):m[1],cap=previous[capIndex];
    const victim=cap&&!reduced()?character(cap.t,cap.c,window.__chessSkinMode==='adult'):null;if(victim){victim.position.copy(place(capIndex));pieces.add(victim);}
    animation={from:m[0],to:m[1]};
    function tick(now){if(disposed||!animation)return;const t=Math.min(1,(now-begun)/380),ease=t*t*(3-2*t);mover.position.lerpVectors(from,to,ease);mover.position.y+=Math.sin(t*Math.PI)*(p.t==='n'?.48:.12);emotion(mover,t);if(rook)rook.position.lerpVectors(rookFrom,rookTo,ease);if(victim){victim.position.y=.12-ease*.6;victim.scale.setScalar(Math.max(.02,1-ease));emotion(victim,t,true);}draw();if(t<1)frame=requestAnimationFrame(tick);else{if(victim)pieces.remove(victim);animation=null;frame=0;draw();}}
    if(!reduced())frame=requestAnimationFrame(tick);else animation=null;
   }
  }highlight(options);resize();
 }
 function pick(x,y){const r=canvas.getBoundingClientRect();pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);let hit=ray.intersectObjects(pieces.children,true)[0]?.object;while(hit&&hit.userData.index===undefined)hit=hit.parent;return hit?.userData.index??ray.intersectObjects(squares,false)[0]?.object.userData.index;}
 let down=null,dragged=false;
 canvas.onpointerdown=e=>{if(e.button!==0)return;down={x:e.clientX,y:e.clientY,angle,elevation,id:e.pointerId};dragged=false;canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.hypot(dx,dy)>8)dragged=true;if(dragged){angle=down.angle-dx*.008;elevation=T.MathUtils.clamp(down.elevation+dy*.006,.55,1.5);draw();}};
 canvas.onpointerup=e=>{if(!down||e.pointerId!==down.id)return;const click=!dragged;down=null;if(click){const i=pick(e.clientX,e.clientY);if(i!==undefined){keyIndex=i;getOptions().onClick?.(i);}}};
 canvas.onpointercancel=()=>{down=null;};canvas.onlostpointercapture=()=>{down=null;};
 canvas.onkeydown=e=>{const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:8,ArrowDown:-8}[e.key];if(step){e.preventDefault();const delta=flipped?-step:step;keyIndex=T.MathUtils.clamp(keyIndex+delta,0,63);cursor.position.copy(place(keyIndex));cursor.position.y=.15;cursor.visible=true;const p=current[keyIndex];canvas.setAttribute('aria-label',`${'abcdefgh'[keyIndex%8]}${Math.floor(keyIndex/8)+1} ${p?(p.c==='w'?'十字军':'明军')+roles[p.t]:'空格'}，回车确认`);draw();}else if(e.key==='Enter'||e.key===' '){e.preventDefault();getOptions().onClick?.(keyIndex);if(!disposed&&stage.isConnected)canvas.focus({preventScroll:true});}};
 canvas.onblur=()=>{cursor.visible=false;draw();};
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(!disposed)onLost();});
 reset();resize();
 return {stats(){return {triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,hunyuanCharacters:pieces.children.filter(p=>p.userData.asset).length,hunyuanPawns:pieces.children.filter(p=>p.userData.asset==='crusaderp').length};},update,highlight,animate,pause(){return animation?.pause?.()||false;},resume(){return animation?.paused?animation.resume():false;},reset,zoom(){zoomed=!zoomed;if(wrap.id==='reviewBoard')elevation=zoomed?.62:1.02;draw();return zoomed;},dispose(){if(disposed)return;disposed=true;stop();observer.disconnect();window.removeEventListener('resize',resize);for(const resource of resources)resource.dispose();renderer.dispose();renderer.forceContextLoss();stage.remove();}};
}
