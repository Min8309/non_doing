import * as THREE from 'three';
// A faceless, round-headed companion in the tea room's ivory/sage/moss palette.
// Separate hip, knee and arm pivots retain real walk and sit animations.
export function createRoundedAvatar(){
 const group=new THREE.Group();group.name='local-avatar';group.userData.design='rounded-sage';
 const colors={ivory:'#d8d4bd',sage:'#a7b595',moss:'#748568',feet:'#687b60'};
 const materials=Object.fromEntries(Object.entries(colors).map(([name,color])=>[name,new THREE.MeshStandardMaterial({color,roughness:.96,metalness:0})]));
 function round(parent,name,x,y,z,sx,sy,sz,material){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),materials[material]);mesh.name=name;mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
 const torso=new THREE.Group();torso.name='avatar-torso';torso.position.y=.35;group.add(torso);
 const profile=[[0,0],[.16,.012],[.25,.04],[.30,.12],[.31,.25],[.29,.40],[.24,.53],[.16,.59],[0,.61]].map(([x,y])=>new THREE.Vector2(x,y));
 const body=new THREE.Mesh(new THREE.LatheGeometry(profile,32),materials.sage);body.name='sage-body';body.castShadow=true;body.receiveShadow=true;torso.add(body);
 const head=round(torso,'rounded-head',0,.86,0,.32,.32,.32,'ivory');
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.name=side<0?'left-arm':'right-arm';arm.position.set(side*.27,.44,0);arm.rotation.z=side*.1;torso.add(arm);
  const sleeve=new THREE.Mesh(new THREE.CapsuleGeometry(.082,.23,6,12),materials.sage);sleeve.name='rounded-sleeve';sleeve.position.y=-.15;sleeve.castShadow=true;arm.add(sleeve);
  round(arm,'ivory-mitten',0,-.35,-.015,.083,.096,.083,'ivory');arms.push(arm);
  const hip=new THREE.Group();hip.name=side<0?'left-hip':'right-hip';hip.position.set(side*.14,.36,0);group.add(hip);
  round(hip,'short-thigh',0,-.07,0,.112,.15,.12,'moss');
  const knee=new THREE.Group();knee.name='knee';knee.position.y=-.15;hip.add(knee);
  round(knee,'short-shin',0,-.07,0,.102,.105,.115,'moss');
  const foot=round(knee,'rounded-foot',0,-.14,-.075,.135,.075,.175,'feet');
  legs.push({hip,knee,foot});
 }
 function pose({sitting=0,walking=false,travel=0,reducedMotion=false}={}){
  const cycle=reducedMotion?0:Math.sin(travel*11);
  torso.position.y=.35-sitting*.13+(walking&&!reducedMotion?Math.sin(travel*22)*.007:0);
  torso.rotation.z=walking&&!reducedMotion?cycle*.035:0;
  for(let i=0;i<legs.length;i++){
   const {hip,knee}=legs[i];hip.position.y=.36-sitting*.13;
   hip.rotation.x=sitting*Math.PI*.46+(walking?cycle*.28*(i?1:-1):0);
   knee.rotation.x=-sitting*Math.PI*.46;
  }
  arms.forEach((arm,i)=>arm.rotation.x=sitting*-.55+(walking?cycle*.19*(i?-1:1):0));
 }
 pose();return{group,pose,head,torso,body,arms,legs,materials};
}
