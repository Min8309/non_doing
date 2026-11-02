import * as THREE from 'three';
import { createRoundedAvatar } from './rounded-avatar.mjs';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { findRoomPath, walkable3D } from '../lib/room-navigation.mjs';
export const places={
 tea:{approach:{x:-2.6,z:14.2},seat:{x:-2.6,z:13.85},angle:0,anchor:new THREE.Vector3(-2.6,1.7,12.1)},
 sofa:{approach:{x:3.1,z:14.7},seat:{x:3.1,z:16},angle:0,lift:.45,anchor:new THREE.Vector3(3.1,1.8,16)},
 window:{approach:{x:3.4,z:10.7},seat:{x:4.65,z:10.7},angle:-Math.PI/2,lift:.7,anchor:new THREE.Vector3(4.65,1.8,10.7)}
};
export function createRoom(host,callbacks){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#bfcdb9');scene.fog=new THREE.Fog('#bfcdb9',30,100);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<700?1.5:2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.domElement.setAttribute('aria-label','3D tea room');renderer.domElement.id='room3DCanvas';host.append(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(53,1,.1,160);camera.position.set(0,3.2,12.3);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1,5.4);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=2.4;controls.maxDistance=12;controls.minPolarAngle=.35;controls.maxPolarAngle=Math.PI*.48;controls.zoomSpeed=.6;controls.rotateSpeed=.55;
 const hemi=new THREE.HemisphereLight('#edf0d9','#7b7d61',2.5);scene.add(hemi);
 const sun=new THREE.DirectionalLight('#eef2e7',1.7);sun.position.set(-10,18,-5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-22;sun.shadow.normalBias=.06;scene.add(sun);scene.add(new THREE.AmbientLight('#aab99e',.5));
 const mats={};function material(color){return mats[color]||(mats[color]=new THREE.MeshStandardMaterial({color,roughness:.94,flatShading:true}))}
 const collidables=[],actions=[];
 function box(w,h,d,x,y,z,color,parent=scene){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
 function ellipsoid(x,y,z,sx,sy,sz,color,parent=scene){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),material(color));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
 function cylinder(radius,height,x,y,z,color,parent=scene){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius*.94,height,12),material(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
 function groupAction(group,action){group.userData.action=action;actions.push(group)}
 // Outdoor mountain garden and rain, in the original sage-and-wood palette.
 box(150,.4,120,0,-.85,-34,'#829a78');
 const water=new THREE.Mesh(new THREE.CircleGeometry(12,64),new THREE.MeshStandardMaterial({color:'#b0c6ab',roughness:.4,metalness:.04}));water.rotation.x=-Math.PI/2;water.scale.set(1,.65,1);water.position.set(0,-.61,-12);scene.add(water);
 for(let i=0;i<5;i++){const ring=new THREE.Mesh(new THREE.RingGeometry(.8+i*.12,.815+i*.12,48),new THREE.MeshBasicMaterial({color:'#d4e0bf',transparent:true,opacity:.35,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.scale.y=.6;ring.position.set([-4,3,-1,6,-6][i],-.59,[-10,-8,-16,-16,-14][i]);scene.add(ring)}
 for(let i=0;i<12;i++){const geometry=new THREE.SphereGeometry(1,20,12);const mountain=new THREE.Mesh(geometry,material(i%2?'#9bb295':'#adc0a1'));mountain.position.set(-65+i*12,-1,-48-(i%3)*10);mountain.scale.set(16+i%3*3,7+i%4*1.5,9);scene.add(mountain)}
 function tree(x,z,size){const tree=new THREE.Group();tree.position.set(x,-.65,z);cylinder(.15*size,3.2*size,0,1.6*size,0,'#607753',tree);for(let i=0;i<4;i++)ellipsoid(Math.sin(i*2)*size*.8,(2.9+i*.38)*size,Math.cos(i*2)*size*.5,size*(1.2-i*.1),size*.35,size*.8,i%2?'#849b71':'#6c875f',tree);scene.add(tree)}
 tree(-8,-5,1.5);tree(9,-8,1.8);tree(-14,-20,1.7);tree(17,-24,2);
 for(const [x,z]of [[-7,-12],[7,-16],[-4,-21]])ellipsoid(x,-.4,z,1.1,.45,.7,'#7f8c70');
 const temple=new THREE.Group();box(3,2,2,0,.2,0,'#b7bba0',temple);const roof=new THREE.Mesh(new THREE.ConeGeometry(2.7,1,4),material('#657b60'));roof.rotation.y=Math.PI/4;roof.position.y=1.65;temple.add(roof);temple.position.set(-14,0,-22);scene.add(temple);
 const rainPositions=new Float32Array(150*6);for(let i=0;i<150;i++){let x=(Math.random()-.5)*42,y=Math.random()*12,z=-Math.random()*33;rainPositions.set([x,y,z,x-.035,y-.32,z],i*6)}
 const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));const rain=new THREE.LineSegments(rainGeometry,new THREE.LineBasicMaterial({color:'#e7ecd5',transparent:true,opacity:.24}));scene.add(rain);
 // A continuous walkable wooden floor joins the veranda and the tea room.
 const floor=box(12,.22,18,0,-.11,11,'#9b9878');floor.userData.floor=true;collidables.push(floor);
 for(let z=2;z<20;z+=.5){const seam=box(12,.006,.012,0,.006,z,'#7e8364');seam.castShadow=false}
 for(let x=-6;x<=6;x+=1.5)for(let z=2;z<20;z+=3){const seam=box(.012,.006,3,x,.008,z+(x%3?1.5:0),'#7e8364');seam.castShadow=false}
 box(12,.15,.2,0,-.25,2,'#657658');
 // Hanok posts and exposed beams. No opaque roof hides the room during a tour.
 for(const x of [-5.8,5.8])for(const z of [2.2,8,19.7])box(.22,4.5,.22,x,2.2,z,'#748165');
 for(const z of [8,19.7])box(12,.25,.24,0,4.4,z,'#748165');
 box(.2,.22,17.5,-5.8,4.4,11,'#748165');box(.2,.22,17.5,5.8,4.4,11,'#748165');
 // Paper-and-timber walls; the right window opens onto trees and the pond.
 box(12,4.1,.16,0,2.03,20,'#dedcca');
 box(.16,4.1,12,-6,2.03,14,'#d8d9c3');
 for(const z of [8,14,20])box(.2,4.4,.22,-5.9,2.2,z,'#8b9475');
 const paper=new THREE.MeshStandardMaterial({color:'#e0e1cb',roughness:1,side:THREE.DoubleSide});
 for(let i=0;i<4;i++){const pane=new THREE.Mesh(new THREE.PlaneGeometry(2.65,2.7),paper);pane.position.set(-4.3+i*2.87,2.35,19.89);scene.add(pane);for(let j=0;j<5;j++)box(.035,2.72,.04,-5.6+i*2.87+j*.55,2.35,19.84,'#a0a88a');for(let k=0;k<4;k++)box(2.7,.035,.04,-4.3+i*2.87,1.1+k*.83,19.84,'#a0a88a')}
 box(.18,.9,12,6,.45,14,'#d4d8bf');box(.18,.7,12,6,3.85,14,'#d4d8bf');
 for(const z of [8,12,16,20])box(.23,3,.16,6,2.2,z,'#8d997b');
 box(.3,.14,12,5.9,1,14,'#a3ab8b');box(.3,.14,12,5.9,3.5,14,'#8d997b');
 // Furniture meshes, with real floor collision boxes in room-navigation.mjs.
 const tea=new THREE.Group();box(2.8,.16,1.7,-2.6,.77,12.2,'#9f9674',tea);for(const x of [-3.7,-1.5])for(const z of [11.6,12.8])box(.13,.7,.13,x,.35,z,'#71805c',tea);
 box(1.3,.12,.55,-2.7,.9,12.1,'#728366',tea);cylinder(.24,.22,-2.7,1.02,12.05,'#c9cfb5',tea);ellipsoid(-2.7,1.15,12.05,.2,.045,.2,'#b5c3a4',tea);cylinder(.06,.04,-2.7,1.19,12.05,'#748968',tea);box(.22,.08,.09,-2.4,1.04,12.05,'#c9cfb5',tea);
 for(const x of [-3.2,-2.15]){cylinder(.12,.12,x,.98,12.35,'#e0dcc3',tea);cylinder(.09,.008,x,1.045,12.35,'#8d9b77',tea)}
 box(1.1,.16,.8,-2.6,.1,13.8,'#9cac86');groupAction(tea,'tea');scene.add(tea);
 const sofa=new THREE.Group();box(3,.48,1.35,3.25,.42,16.1,'#8a9e7e',sofa);box(3,.75,.24,3.25,.95,16.72,'#879b79',sofa);for(const x of [1.75,4.75])box(.23,.7,1.45,x,.78,16.1,'#8a9e7e',sofa);for(const x of [2.4,4.1]){const cushion=box(.65,.65,.23,x,1,16.48,x<3?'#c9cbb0':'#a4b494',sofa);cushion.rotation.z=x<3?-.12:.12}groupAction(sofa,'sofa');scene.add(sofa);
 const bench=new THREE.Group();box(1.1,.16,2.4,4.8,.75,10.7,'#a5ad8c',bench);for(const z of [9.8,11.6])box(.15,.7,.15,4.8,.35,z,'#72845f',bench);box(.8,.1,1.1,4.8,.88,10.7,'#c5cbad',bench);groupAction(bench,'window');scene.add(bench);
 const cabinet=new THREE.Group();box(2.4,1.25,.8,-4, .625,18.4,'#8e9b78',cabinet);box(2.55,.12,.95,-4,1.3,18.4,'#738663',cabinet);for(const x of [-4.6,-3.4])ellipsoid(x,.65,17.97,.045,.045,.035,'#c8c9a8',cabinet);scene.add(cabinet);
 const mailbox=new THREE.Group();box(.65,.5,.4,-3.4,1.6,18.3,'#a7aa87',mailbox);box(.7,.07,.44,-3.4,1.87,18.3,'#7c916d',mailbox);box(.4,.22,.012,-3.4,1.6,18.085,'#dedcc0',mailbox);groupAction(mailbox,'mail');scene.add(mailbox);
 cylinder(.17,.4,-4.7,1.55,18.4,'#c2c9ac');cylinder(.018,.75,-4.7,2.05,18.4,'#768963');ellipsoid(-4.58,2.2,18.4,.19,.06,.09,'#90a47b');ellipsoid(-4.82,2.35,18.4,.17,.06,.08,'#90a47b');
 cylinder(.05,2.1,5,1.05,18.4,'#81916d');const lamp=new THREE.Mesh(new THREE.CylinderGeometry(.35,.45,.7,14),new THREE.MeshStandardMaterial({color:'#ddd9b8',emissive:'#9d9d6d',emissiveIntensity:.15,roughness:1}));lamp.position.set(5,2.2,18.4);scene.add(lamp);
 // Rounded avatar with a large ivory head and short, soft moss-colored limbs.
 const avatarRig=createRoundedAvatar();const avatar=avatarRig.group;scene.add(avatar);
 const destination=new THREE.Mesh(new THREE.RingGeometry(.16,.2,28),new THREE.MeshBasicMaterial({color:'#e5ebce',transparent:true,opacity:.65,side:THREE.DoubleSide}));destination.rotation.x=-Math.PI/2;destination.position.y=.025;destination.visible=false;scene.add(destination);
 let state='idle',selected=null,route=[],arrival=null,sitting=0,sitTime=0,seatStart=null;
 let actor={x:0,z:5.4},travel=0,angle=0,autoCamera=true,cameraYaw=0,desiredYaw=0,lastTime=0,frameId=null,destroyed=false,contextLost=false;
 const target=new THREE.Vector3(),offset=new THREE.Vector3();let reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
 controls.addEventListener('start',()=>{autoCamera=false});
 function emit(){callbacks.onState?.(state,selected)}
 function pose(){avatar.position.set(actor.x,sitting*(places[selected]?.lift||0),actor.z);avatar.rotation.y=angle;avatarRig.pose({sitting,walking:state==='walking',travel,reducedMotion})}
 function stop(){if(selected&&(state==='seated'||state==='sitting'))actor={...places[selected].approach};state='idle';selected=null;route=[];arrival=null;sitting=0;destination.visible=false;pose();emit()}
 function navigate(point,kind=null){if(!walkable3D(point.x,point.z))return false;stop();route=findRoomPath(actor,point);if(!route.length)return false;state='walking';arrival=kind;autoCamera=true;desiredYaw=point.z>8?Math.PI:0;destination.position.set(point.x,.025,point.z);destination.visible=true;emit();return true}
 function chooseSeat(key){if(!places[key])return;const place=places[key];navigate(place.approach,key);selected=key;emit()}
 function beginSit(now){seatStart={...actor};sitTime=now;state='sitting';sitting=0;destination.visible=false;angle=places[selected].angle;emit()}
 function update(dt,now){
  if(state==='walking'){
   let budget=dt*2.0;while(route.length&&budget>0){const next=route[0],dx=next.x-actor.x,dz=next.z-actor.z,d=Math.hypot(dx,dz);if(d>.001)angle=Math.atan2(-dx,-dz);if(d<=budget){actor={...next};route.shift();travel+=d;budget-=d}else{actor.x+=dx/d*budget;actor.z+=dz/d*budget;travel+=budget;budget=0}}
   if(!route.length){destination.visible=false;if(places[arrival])beginSit(now);else{state='idle';const action=arrival;arrival=null;emit();if(action==='mail')callbacks.onMailbox?.()}}
  }
  if(state==='sitting'){
   sitting=reducedMotion?1:Math.min((now-sitTime)/700,1);const ease=1-(1-sitting)**3;const seat=places[selected].seat;actor.x=seatStart.x+(seat.x-seatStart.x)*ease;actor.z=seatStart.z+(seat.z-seatStart.z)*ease;
   if(sitting>=1){state='seated';emit();callbacks.onSit?.(selected)}
  }
  pose();
  const lookingOut=Math.cos(desiredYaw)>.5&&actor.z<8;
  target.set(actor.x,lookingOut?1.7:1.15,actor.z-(lookingOut?3.5:0));
  if(autoCamera){let delta=Math.atan2(Math.sin(desiredYaw-cameraYaw),Math.cos(desiredYaw-cameraYaw));cameraYaw+=delta*Math.min(1,dt*1.9);const distance=innerWidth<700?7.1:6.8;offset.set(Math.sin(cameraYaw)*distance,3.1,Math.cos(cameraYaw)*distance);const desired=new THREE.Vector3(actor.x,1.15,actor.z).add(offset);desired.x=THREE.MathUtils.clamp(desired.x,-5.65,5.65);desired.z=THREE.MathUtils.clamp(desired.z,-1,19.35);camera.position.lerp(desired,1-Math.exp(-dt*4));controls.target.lerp(target,1-Math.exp(-dt*7));}
  else{const change=target.clone().sub(controls.target);camera.position.add(change);controls.target.copy(target)}
  controls.update();camera.position.x=THREE.MathUtils.clamp(camera.position.x,-5.65,5.65);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-1,19.35);camera.position.y=THREE.MathUtils.clamp(camera.position.y,1.6,7);callbacks.onZone?.(actor.z>8);
 }
 function click(event){if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>7||event.pointerId!==down.id){down=null;return}down=null;if(callbacks.paused?.())return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const intersections=raycaster.intersectObjects([...actions,...collidables],true);for(const hit of intersections){let object=hit.object;while(object&&!object.userData.action&&!object.userData.floor)object=object.parent;if(!object)continue;if(object.userData.action==='mail'){navigate({x:-3.5,z:16.8},'mail')}else if(object.userData.action){chooseSeat(object.userData.action)}else{navigate({x:hit.point.x,z:hit.point.z})}break}}
 renderer.domElement.addEventListener('pointerdown',event=>{down=event.isPrimary?{x:event.clientX,y:event.clientY,id:event.pointerId}:null;renderer.domElement.focus({preventScroll:true})});renderer.domElement.addEventListener('pointerup',click);renderer.domElement.addEventListener('pointercancel',()=>down=null);renderer.domElement.tabIndex=0;
 function move(dx,dz){const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();const right=new THREE.Vector3(-forward.z,0,forward.x);const point={x:actor.x+right.x*dx+forward.x*dz,z:actor.z+right.z*dx+forward.z*dz};navigate(point)}
 renderer.domElement.addEventListener('keydown',event=>{const map={ArrowUp:[0,1],w:[0,1],ArrowDown:[0,-1],s:[0,-1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};if(map[event.key]){event.preventDefault();move(...map[event.key])}});
 function project(vector){const value=vector.clone().project(camera);return {x:(value.x+1)/2*host.clientWidth,y:(1-value.y)/2*host.clientHeight,visible:value.z>-1&&value.z<1&&Math.abs(value.x)<.95&&Math.abs(value.y)<.95}}
 function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix()}
 function render(now){if(destroyed)return;frameId=requestAnimationFrame(render);if(document.hidden||contextLost||callbacks.paused?.()){lastTime=0;return}const dt=lastTime?Math.min((now-lastTime)/1000,.1):.016;lastTime=now;update(dt,now);if(!reducedMotion){const positions=rainGeometry.attributes.position;for(let i=0;i<150;i++){const p=i*6;rainPositions[p+1]-=dt*4;rainPositions[p+4]-=dt*4;if(rainPositions[p+1]<0){rainPositions[p+1]=12;rainPositions[p+4]=11.68}}positions.needsUpdate=true}renderer.render(scene,camera);callbacks.onMarkers?.(Object.fromEntries(Object.entries(places).map(([key,value])=>[key,project(value.anchor)])))}
 window.addEventListener('resize',resize);const media=matchMedia('(prefers-reduced-motion: reduce)');media.addEventListener('change',event=>reducedMotion=event.matches);
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;callbacks.onError?.('CONTEXT_LOST')});renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;callbacks.onRestore?.()});
 resize();pose();controls.update();frameId=requestAnimationFrame(render);
 return {scene,camera,renderer,controls,avatar,chooseSeat,navigate,stop,move,update,project,resize,get actor(){return {...actor}},get state(){return state},get selected(){return selected},get route(){return route.map(p=>({...p}))},tour(){navigate({x:0,z:11})},porch(){navigate({x:0,z:5.4})},turn(){autoCamera=true;desiredYaw=desiredYaw===0?Math.PI:0},dispose(){destroyed=true;cancelAnimationFrame(frameId);controls.dispose();renderer.dispose();window.removeEventListener('resize',resize)}};
}
