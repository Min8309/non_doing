const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export function capsuleGlowFrame(radius,progress,seconds,hover=0,reduced=false){
 const remaining=clamp(1-progress,0,1),focus=clamp(hover,0,1);
 const breath=reduced?1:.94+.06*Math.sin(seconds*Math.PI/4);
 const fade=Math.pow(remaining,.35);
 return{alpha:(.32+focus*.28)*fade*breath,haloAlpha:(.11+focus*.12)*fade*breath,blur:Math.min(28,Math.max(0,radius)*(.2+focus*.08)),lineWidth:Math.min(1,Math.max(0,radius)/18)*(.8+focus*.55),focus};
}
export function isPointInCapsule(px,py,cx,cy,radius,water=false){
 if(radius<=0)return false;
 const x=(px-cx)/radius,y=(py-cy)/(radius*(water?1.08:1));
 return x*x+y*y<=1.12;
}
