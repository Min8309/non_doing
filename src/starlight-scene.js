export {canvasMetrics} from '../lib/canvas-sizing.mjs';
export {drawCapsuleGlow,capsuleGlowFrame,isPointInCapsule} from './capsule-glow.js';
import { createStarField, projectStar, infallGeometry, projectInfallStar } from '../lib/starfield-motion.mjs';
export { createStarField, projectStar, infallGeometry, projectInfallStar };
const tones=['#dce8f4','#c5dfeb','#eee5d3'];
const scratch={};
let sprites=null;
function glowSprites(){if(sprites)return sprites;sprites=tones.map(color=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=40;const ctx=canvas.getContext('2d');const gradient=ctx.createRadialGradient(20,20,0,20,20,20);gradient.addColorStop(0,color);gradient.addColorStop(.12,color+'ca');gradient.addColorStop(.35,color+'20');gradient.addColorStop(1,color+'00');ctx.fillStyle=gradient;ctx.fillRect(0,0,40,40);return canvas});return sprites}
function drawNebula(ctx,width,height,seconds,reduced){
 const t=reduced?0:seconds;
 const base=ctx.createLinearGradient(0,0,width*.6,height);base.addColorStop(0,'#040913');base.addColorStop(.5,'#0a1321');base.addColorStop(1,'#050a13');ctx.fillStyle=base;ctx.fillRect(0,0,width,height);
 ctx.save();ctx.translate(width*.5+Math.sin(t*.015)*width*.012,height*.5);ctx.rotate(-.5);ctx.scale(1,.6);
 const radius=Math.max(width,height)*.65;
 for(let i=0;i<6;i++){
  const x=(i-2.5)*radius*.25,y=Math.sin(i*1.3)*radius*.11;
  const haze=ctx.createRadialGradient(x,y,0,x,y,radius*.56);
  haze.addColorStop(0,i%2?'#2954511d':'#344c751f');haze.addColorStop(.45,i%2?'#2340440c':'#263b590f');haze.addColorStop(1,'#09131e00');
  ctx.fillStyle=haze;ctx.fillRect(x-radius*.56,y-radius*.56,radius*1.12,radius*1.12);
 }
 ctx.restore();
}
export function drawStarJourney(ctx,width,height,seconds,field,reduced=false,infall=false){
 ctx.save();ctx.globalAlpha=1;drawNebula(ctx,width,height,seconds,reduced);
 const sprites=glowSprites();
 for(const star of field){
  const point=(infall?projectInfallStar:projectStar)(star,seconds,width,height,reduced,scratch);if(!point.visible)continue;
  ctx.globalAlpha=point.alpha;
  if(point.radius>1){const extent=point.radius*5;ctx.drawImage(sprites[star.tone],point.x-extent/2,point.y-extent/2,extent,extent)}
  ctx.fillStyle=tones[star.tone];ctx.beginPath();ctx.arc(point.x,point.y,point.radius*.55,0,Math.PI*2);ctx.fill();
 }
 // Quiet top/bottom shading keeps breathing guidance readable as stars move.
 ctx.globalAlpha=1;const shade=ctx.createLinearGradient(0,0,0,height);shade.addColorStop(0,'#03081288');shade.addColorStop(.25,'#03081200');shade.addColorStop(.72,'#03081200');shade.addColorStop(1,'#0308128c');ctx.fillStyle=shade;ctx.fillRect(0,0,width,height);ctx.restore();
}

export function drawBlackHoleCapsule(ctx,radius,seconds,reduced=false){
 if(radius<=0)return;
 ctx.save();
 const halo=ctx.createRadialGradient(0,0,radius*.85,0,0,radius*1.7);
 halo.addColorStop(0,'#8ebdc942');halo.addColorStop(.24,'#6097a51f');halo.addColorStop(1,'#1a394700');
 ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,radius*1.7,0,Math.PI*2);ctx.fill();
 const core=ctx.createRadialGradient(0,0,0,0,0,radius);
 core.addColorStop(0,'#010208');core.addColorStop(.7,'#02050b');core.addColorStop(1,'#07121df5');
 ctx.fillStyle=core;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#bddbe77a';ctx.lineWidth=.8;ctx.stroke();
 // A faint, slowly turning accretion rim, with no flashes or rapid spin.
 const rotation=reduced?0:seconds*.012;
 ctx.rotate(rotation);ctx.strokeStyle='#b6d3da4d';ctx.lineWidth=Math.max(.5,radius*.012);
 ctx.beginPath();ctx.ellipse(0,0,radius*1.035,radius*.98,-.15,Math.PI*.1,Math.PI*.8);ctx.stroke();
 ctx.restore();
}
export function drawBlackHoleRelease(ctx,width,height,seconds){
 const fade=Math.max(0,1-seconds/1.8);if(!fade)return;
 ctx.save();ctx.translate(width/2,height/2);ctx.globalAlpha=fade;
 const radius=2+fade*10;const glow=ctx.createRadialGradient(0,0,0,0,0,radius*2);
 glow.addColorStop(0,'#b7d9df55');glow.addColorStop(1,'#b7d9df00');ctx.fillStyle=glow;ctx.fillRect(-radius*2,-radius*2,radius*4,radius*4);
 ctx.fillStyle='#010208';ctx.beginPath();ctx.arc(0,0,radius*.38,0,Math.PI*2);ctx.fill();ctx.restore();
}
