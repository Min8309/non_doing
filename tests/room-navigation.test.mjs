import test from 'node:test';
import assert from 'node:assert/strict';
import { findRoomPath, walkable3D, roomObstacles } from '../lib/room-navigation.mjs';
test('porch, furniture approaches and mailbox are reachable without crossing furniture',()=>{
 const destinations=[{x:0,z:11},{x:-2.6,z:14.2},{x:3.1,z:14.7},{x:3.4,z:10.7},{x:-3.5,z:16.8},{x:0,z:5.4}];
 let from={x:0,z:5.4};
 for(const destination of destinations){const path=findRoomPath(from,destination);assert.ok(path.length>0);assert.deepEqual(path.at(-1),destination);for(let i=0;i<path.length;i++){assert.ok(walkable3D(path[i].x,path[i].z));if(i){for(let n=1;n<=5;n++){const p={x:path[i-1].x+(path[i].x-path[i-1].x)*n/5,z:path[i-1].z+(path[i].z-path[i-1].z)*n/5};assert.ok(walkable3D(p.x,p.z))}}}from=destination}
});
test('the avatar cannot walk outside the veranda or into solid furniture',()=>{
 assert.deepEqual(findRoomPath({x:0,z:5.4},{x:0,z:-10}),[]);
 assert.deepEqual(findRoomPath({x:0,z:5.4},{x:10,z:10}),[]);
 for(const obstacle of roomObstacles){const center={x:(obstacle.minX+obstacle.maxX)/2,z:(obstacle.minZ+obstacle.maxZ)/2};assert.equal(walkable3D(center.x,center.z),false);assert.deepEqual(findRoomPath({x:0,z:5.4},center),[])}
});
