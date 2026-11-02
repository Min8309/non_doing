import test from 'node:test';
import assert from 'node:assert/strict';
import {canvasMetrics} from '../lib/canvas-sizing.mjs';
test('circle and water-drop proportions survive fractional mobile viewport sizes and pixel densities',()=>{
 for(const [w,h]of [[390,844],[390,620],[844,390],[320,568],[393.33,710.66]])for(const dpr of [1,1.25,2,2.625,3]){
  const m=canvasMetrics(w,h,dpr),radius=90;
  const shownX=radius*m.scaleX*w/m.pixelWidth,shownY=radius*m.scaleY*h/m.pixelHeight;
  assert.ok(Math.abs(shownX-shownY)<1e-10);
  const dropWidth=2*radius*m.scaleX*w/m.pixelWidth,dropHeight=2.08*radius*m.scaleY*h/m.pixelHeight;
  assert.ok(Math.abs(dropWidth/dropHeight-2/2.08)<1e-10);
  assert.ok(m.pixelWidth<=Math.round(w*2));assert.ok(m.pixelHeight<=Math.round(h*2));
 }
});
test('hidden or invalid CSS boxes cannot reset the drawing surface to zero',()=>{
 for(const [w,h]of [[0,844],[390,0],[-1,20],[NaN,500],[390,Infinity]])assert.equal(canvasMetrics(w,h),null);
 assert.equal(canvasMetrics(390,620).height,620);
});
