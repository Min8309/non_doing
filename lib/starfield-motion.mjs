const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const modulo=(value,range)=>((value%range)+range)%range;
export const STAR_DEPTH={near:.55,far:3.75};
export function createStarField(width,height,seed=1){
 let state=seed>>>0;
 function random(){state=(state+0x6D2B79F5)>>>0;let value=Math.imul(state^(state>>>15),1|state);value^=value+Math.imul(value^(value>>>7),61|value);return((value^(value>>>14))>>>0)/4294967296;}
 const count=clamp(Math.round(width*height*.0022),620,1500);
 return Array.from({length:count},()=>({x:(random()-.5)*4.8,y:(random()-.5)*4.8,depth:STAR_DEPTH.near+random()*(STAR_DEPTH.far-STAR_DEPTH.near),speed:.014+random()*.012,size:.35+random()*.85,brightness:.34+random()*.55,phase:random()*Math.PI*2,tone:Math.floor(random()*3)}));
}
// Project a slow forward drift. Both ends of the depth cycle are transparent,
// so recycling a star cannot make it suddenly pop into view.
export function projectStar(star,seconds,width,height,reduced=false,out={}){
 const t=reduced?0:Math.max(0,seconds),{near,far}=STAR_DEPTH;
 const z=near+modulo(star.depth-near-star.speed*t,far-near);
 const focusX=width*(.5+Math.sin(t*.021)*.012),focusY=height*(.46+Math.sin(t*.017)*.008);
 out.x=focusX+star.x/z*width*.68;out.y=focusY+star.y/z*height*.68;
 out.radius=clamp(star.size/z*(width<700?2.2:2.8),.22,4.4);
 const nearFade=clamp((z-near)/.28,0,1),farFade=clamp((far-z)/.4,0,1);
 const centerDistance=Math.hypot((out.x-width*.5)/width,(out.y-height*.48)/height);
 const centerFade=.34+.66*clamp(centerDistance/.2,0,1);
 const shimmer=reduced?1:.94+.06*Math.sin(t*.22+star.phase);
 out.alpha=star.brightness*nearFade*farFade*centerFade*shimmer;
 out.depth=z;out.visible=out.x>-20&&out.x<width+20&&out.y>-20&&out.y<height+20&&out.alpha>.015;
 return out;
}

// Mobile infall shares a single center/radius with the thought capsule.
export function infallGeometry(seconds,width,height,reduced=false){
 const progress=clamp(seconds/60,0,1);
 const pulse=reduced?1:1+.012*Math.sin(seconds*Math.PI/6)*(1-progress);
 return{x:width/2,y:height/2,radius:Math.min(width*.29,height*.21,135)*Math.pow(1-progress,1.15)*pulse,progress};
}
export function projectInfallStar(star,seconds,width,height,reduced=false,out={}){
 const t=reduced?0:clamp(seconds,0,60),progress=t/60;
 const cycle=18+star.depth*5;
 const phase=modulo(t/cycle+star.phase/(Math.PI*2),1);
 const initial=projectStar(star,0,width,height,true);
 const dx=initial.x-width/2,dy=initial.y-height/2;
 const angle=Math.atan2(dy,dx)+(reduced?0:phase*.65);
 const distance=Math.hypot(dx,dy)*Math.pow(1-phase,1.4)*Math.pow(1-progress,.95);
 out.x=width/2+Math.cos(angle)*distance;out.y=height/2+Math.sin(angle)*distance;
 out.radius=clamp(initial.radius*(.22+.78*Math.pow(1-phase,.65)),.18,3.8);
 const arrivalFade=clamp(phase/.14,0,1)*clamp((1-phase)/.18,0,1);
 out.alpha=star.brightness*arrivalFade*Math.pow(1-progress,.6);
 out.visible=out.x>-20&&out.x<width+20&&out.y>-20&&out.y<height+20&&out.alpha>.012;
 out.phase=phase;out.distance=distance;
 return out;
}
