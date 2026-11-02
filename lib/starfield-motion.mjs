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
