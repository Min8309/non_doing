import test from 'node:test';
import assert from 'node:assert/strict';
import { createStarField, projectStar, STAR_DEPTH } from '../lib/starfield-motion.mjs';
test('the star field has bounded density and deterministic depth-based movement',()=>{
 const field=createStarField(1440,1000,42);assert.ok(field.length<=1500);assert.deepEqual(field,createStarField(1440,1000,42));
 assert.ok(createStarField(390,844,42).length<field.length);
 const star={x:.4,y:.2,depth:2,speed:.02,size:.6,brightness:.7,phase:0};
 const first=projectStar(star,0,1440,1000),later=projectStar(star,20,1440,1000);
 assert.ok(later.depth<first.depth);assert.ok(later.radius>first.radius);assert.ok(later.x>first.x);
});
test('recycled stars fade out at the near and far depth boundaries',()=>{
 const star={x:0,y:0,depth:1,speed:.02,size:.6,brightness:.7,phase:0};
 const wrap=(star.depth-STAR_DEPTH.near)/star.speed;
 for(const t of [wrap-.001,wrap+.001]){const point=projectStar(star,t,390,844);assert.ok(point.alpha<.001);assert.equal(point.visible,false)}
});
test('reduced motion freezes the star field and all projections stay finite on mobile',()=>{
 for(const star of createStarField(320,568,7)){
  assert.deepEqual(projectStar(star,0,320,568,true),projectStar(star,60,320,568,true));
  for(const t of [0,15,60,1200]){const p=projectStar(star,t,320,568);assert.ok([p.x,p.y,p.radius,p.alpha,p.depth].every(Number.isFinite));assert.ok(p.alpha>=0&&p.alpha<=1);assert.ok(p.radius<=4.4)}
 }
});

test('mobile black-hole circle contracts continuously over the full 60 seconds',async()=>{
 const {infallGeometry}=await import('../lib/starfield-motion.mjs');
 for(const [w,h]of [[320,568],[390,844],[844,390]]){
  let previous=Infinity;
  for(let t=0;t<=60;t+=.1){const p=infallGeometry(t,w,h);assert.ok(p.radius<=previous+.000001);assert.equal(p.x,w/2);assert.equal(p.y,h/2);previous=p.radius}
  assert.equal(infallGeometry(60,w,h).radius,0);
 }
});
test('mobile stars spiral inward gently, fade at recycling and disappear by 60 seconds',async()=>{
 const {projectInfallStar}=await import('../lib/starfield-motion.mjs');
 const star={x:1,y:.5,depth:2,speed:.02,size:.8,brightness:.8,phase:0};
 const first=projectInfallStar(star,2,390,844),later=projectInfallStar(star,10,390,844);
 assert.ok(later.distance<first.distance);assert.ok(later.radius<first.radius);
 const cycle=18+star.depth*5;
 assert.ok(projectInfallStar(star,cycle-.0001,390,844).alpha<.0001);
 assert.ok(projectInfallStar(star,cycle+.0001,390,844).alpha<.0001);
 for(const s of createStarField(390,844,7)){
  assert.equal(projectInfallStar(s,60,390,844).visible,false);
  assert.deepEqual(projectInfallStar(s,0,390,844,true),projectInfallStar(s,60,390,844,true));
 }
});
