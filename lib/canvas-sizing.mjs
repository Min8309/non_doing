// Logical drawing units are CSS pixels, not window.innerHeight. Using the
// measured viewport avoids stretching when mobile browser chrome/keyboard move.
export function canvasMetrics(width,height,dpr=1){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return null;
 const density=Math.min(2,Math.max(1,Number.isFinite(dpr)?dpr:1));
 const pixelWidth=Math.max(1,Math.round(width*density)),pixelHeight=Math.max(1,Math.round(height*density));
 return{width,height,pixelWidth,pixelHeight,scaleX:pixelWidth/width,scaleY:pixelHeight/height};
}
