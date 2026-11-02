export {capsuleGlowFrame,isPointInCapsule} from '../lib/capsule-glow.mjs';
export function drawCapsuleGlow(ctx,radius,water,frame,layer='halo'){
 if(radius<=0||frame.alpha<=0)return;
 ctx.save();
 if(layer==='halo'){
  const color=water?'150,222,200':'155,207,235';
  const halo=ctx.createRadialGradient(0,0,radius*.7,0,0,radius*1.95);
  halo.addColorStop(0,`rgba(${color},${frame.haloAlpha})`);halo.addColorStop(.4,`rgba(${color},${frame.haloAlpha*.38})`);halo.addColorStop(1,`rgba(${color},0)`);
  ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,radius*1.95,0,Math.PI*2);ctx.fill();
 }else{
  ctx.shadowColor=water?'#a0eed0':'#a3d9f4';ctx.shadowBlur=frame.blur;
  ctx.strokeStyle=`rgba(${water?'190,246,220':'195,230,251'},${frame.alpha})`;ctx.lineWidth=frame.lineWidth;
  ctx.beginPath();
  if(water){
   ctx.moveTo(0,-radius*1.08);
   ctx.bezierCurveTo(radius*.3,-radius*.75,radius,-radius*.48,radius,radius*.12);
   ctx.bezierCurveTo(radius,radius*.66,radius*.6,radius,0,radius);
   ctx.bezierCurveTo(-radius*.6,radius,-radius,radius*.66,-radius,radius*.12);
   ctx.bezierCurveTo(-radius,-radius*.48,-radius*.3,-radius*.75,0,-radius*1.08);ctx.closePath();
  }else{ctx.arc(0,0,radius,0,Math.PI*2)}
  ctx.stroke();
 }
 ctx.restore();
}
