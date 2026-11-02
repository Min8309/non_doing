import { createStarField, projectStar } from '../lib/starfield-motion.mjs';
export { createStarField, projectStar };
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
export function drawStarJourney(ctx,width,height,seconds,field,reduced=false){
 ctx.save();ctx.globalAlpha=1;drawNebula(ctx,width,height,seconds,reduced);
 const sprites=glowSprites();
 for(const star of field){
  const point=projectStar(star,seconds,width,height,reduced,scratch);if(!point.visible)continue;
  ctx.globalAlpha=point.alpha;
  if(point.radius>1){const extent=point.radius*5;ctx.drawImage(sprites[star.tone],point.x-extent/2,point.y-extent/2,extent,extent)}
  ctx.fillStyle=tones[star.tone];ctx.beginPath();ctx.arc(point.x,point.y,point.radius*.55,0,Math.PI*2);ctx.fill();
 }
 // Quiet top/bottom shading keeps breathing guidance readable as stars move.
 ctx.globalAlpha=1;const shade=ctx.createLinearGradient(0,0,0,height);shade.addColorStop(0,'#03081288');shade.addColorStop(.25,'#03081200');shade.addColorStop(.72,'#03081200');shade.addColorStop(1,'#0308128c');ctx.fillStyle=shade;ctx.fillRect(0,0,width,height);ctx.restore();
}
