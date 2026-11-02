export const roomBounds={minX:-5.3,maxX:5.3,minZ:2.4,maxZ:19.2};
export const roomObstacles=[
 {minX:-4.2,maxX:-1,minZ:11.1,maxZ:13.3},
 {minX:1.65,maxX:5.05,minZ:15.15,maxZ:17.25},
 {minX:4,maxX:5.45,minZ:9.3,maxZ:12.25},
 {minX:-5.4,maxX:-2.7,minZ:17.6,maxZ:19.3},
 {minX:4.5,maxX:5.4,minZ:17.7,maxZ:19.3}
];
export function walkable3D(x,z){return x>=roomBounds.minX&&x<=roomBounds.maxX&&z>=roomBounds.minZ&&z<=roomBounds.maxZ&&!roomObstacles.some(b=>x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ)}
const step=.35,key=(x,z)=>x+','+z;
const nodes=new Map();
for(let iz=0;iz<=48;iz++)for(let ix=0;ix<=30;ix++){const x=-5.25+ix*step,z=2.45+iz*step;if(walkable3D(x,z))nodes.set(key(ix,iz),{x,z,ix,iz})}
export function findRoomPath(from,to){
 if(!walkable3D(to.x,to.z))return [];
 const nearest=p=>[...nodes.values()].reduce((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)<Math.hypot(b.x-p.x,b.z-p.z)?a:b);
 const start=nearest(from),end=nearest(to),parents=new Map([[key(start.ix,start.iz),null]]),queue=[start];
 for(let i=0;i<queue.length;i++){const n=queue[i];if(n===end)break;for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const id=key(n.ix+dx,n.iz+dz);if(nodes.has(id)&&!parents.has(id)){parents.set(id,n);queue.push(nodes.get(id))}}}
 if(!parents.has(key(end.ix,end.iz)))return [];
 const path=[];let n=end;while(n){path.push({x:n.x,z:n.z});n=parents.get(key(n.ix,n.iz))}path.reverse();path.push({x:to.x,z:to.z});return path;
}
