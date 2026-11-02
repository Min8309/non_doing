import test from 'node:test';
import assert from 'node:assert/strict';
import {capsuleGlowFrame,isPointInCapsule} from '../lib/capsule-glow.mjs';
test('hover strengthens glow while the halo contracts and disappears with the capsule',()=>{
 const normal=capsuleGlowFrame(110,0,0,0),hover=capsuleGlowFrame(110,0,0,1),small=capsuleGlowFrame(20,.8,48,0),end=capsuleGlowFrame(0,1,60,1);
 assert.ok(hover.alpha>normal.alpha);assert.ok(hover.haloAlpha>normal.haloAlpha);
 assert.ok(small.blur<normal.blur);assert.ok(small.alpha<normal.alpha);
 assert.equal(end.alpha,0);assert.equal(end.haloAlpha,0);assert.equal(end.blur,0);assert.equal(end.lineWidth,0);
});
test('circle and water-drop focus respects position and radius; reduced motion removes pulsing',()=>{
 assert.equal(isPointInCapsule(195,422,195,422,100),true);
 assert.equal(isPointInCapsule(195,322,195,422,100,true),true);
 assert.equal(isPointInCapsule(20,20,195,422,100),false);
 assert.equal(isPointInCapsule(195,422,195,422,0),false);
 assert.deepEqual(capsuleGlowFrame(90,.2,0,.5,true),capsuleGlowFrame(90,.2,5,.5,true));
});
