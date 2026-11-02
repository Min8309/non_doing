'use strict';
// A quiet illustrated pond; all geometry is local and scales to the viewport.
const pondFish = [
  { x: .14, y: .32, size: 23, speed: .009, direction: 1, color: '#b4b5a1', patches: '#718a7c', phase: .5 },
  { x: .67, y: .43, size: 30, speed: .006, direction: -1, color: '#d5d1b7', patches: '#ad8971', phase: 2.1 },
  { x: .82, y: .69, size: 24, speed: .008, direction: 1, color: '#a3b9ae', patches: '#5b7c73', phase: 4.4 },
  { x: .34, y: .78, size: 19, speed: .007, direction: -1, color: '#d3c8a9', patches: '#a47b67', phase: 1.4 },
  { x: .49, y: .22, size: 14, speed: .005, direction: 1, color: '#8fae9e', patches: '#5a7c70', phase: 3.2 }
];
function drawPondFish(fish, seconds) {
  const motion = reduced.matches ? 0 : seconds;
  const x = (((fish.x + motion * fish.speed * fish.direction + .2) % 1.4 + 1.4) % 1.4 - .2) * cw;
  const y = (fish.y + Math.sin(motion * .17 + fish.phase) * .022) * ch;
  const size = fish.size * Math.min(cw / 650, 1.5) + 5;
  const tail = Math.sin(motion * 1.6 + fish.phase) * .13;
  space.save();
  space.translate(x, y);
  space.rotate(Math.sin(motion * .17 + fish.phase) * .09);
  space.scale(fish.direction * size, size);
  // Soft shadow, translucent fins, and a slowly swaying tail.
  space.fillStyle = '#143a3415';
  space.beginPath(); space.ellipse(-.12, .2, 1.1, .4, 0, 0, Math.PI * 2); space.fill();
  space.fillStyle = fish.color;
  space.globalAlpha = .5;
  space.beginPath();
  space.moveTo(-.65, 0); space.quadraticCurveTo(-1.1, -.23 + tail, -1.42, -.47 + tail);
  space.quadraticCurveTo(-1.25, tail, -1.42, .47 + tail);
  space.quadraticCurveTo(-1.05, .22 + tail, -.65, 0); space.fill();
  for (const side of [-1, 1]) {
    space.beginPath(); space.moveTo(.12, side * .19);
    space.quadraticCurveTo(-.15, side * .66, -.51, side * (.53 + tail * .25));
    space.lineTo(-.27, side * .16); space.fill();
  }
  space.globalAlpha = .85;
  space.beginPath(); space.ellipse(0, 0, .9, .29, 0, 0, Math.PI * 2); space.fill();
  space.fillStyle = fish.patches; space.globalAlpha = .6;
  space.beginPath(); space.ellipse(-.14, -.04, .28, .21, -.3, 0, Math.PI * 2); space.fill();
  space.beginPath(); space.ellipse(.43, .01, .14, .18, .25, 0, Math.PI * 2); space.fill();
  space.strokeStyle = '#f0efcd55'; space.lineWidth = .025;
  space.beginPath(); space.moveTo(-.6, -.02); space.quadraticCurveTo(0, -.12, .65, -.02); space.stroke();
  space.fillStyle = '#34594e'; space.globalAlpha = .75;
  space.beginPath(); space.arc(.63, -.105, .033, 0, Math.PI * 2); space.fill();
  space.restore();
}
function drawPondBackground(seconds) {
  const motion = reduced.matches ? 0 : seconds;
  const water = space.createLinearGradient(0, 0, cw * .65, ch);
  water.addColorStop(0, '#789d94'); water.addColorStop(.36, '#426f6c'); water.addColorStop(1, '#183f46');
  space.fillStyle = water; space.fillRect(0, 0, cw, ch);
  // Daylight filters through the water, without flashing or hard contrasts.
  space.save();
  for (let i = 0; i < 5; i++) {
    const x = cw * (.07 + i * .23) + Math.sin(motion * .09 + i) * cw * .025;
    const beam = space.createLinearGradient(x, 0, x + cw * .22, ch);
    beam.addColorStop(0, '#dbe4be12'); beam.addColorStop(1, '#dbe4be00');
    space.fillStyle = beam;
    space.beginPath(); space.moveTo(x, 0); space.lineTo(x + cw * .12, 0);
    space.lineTo(x + cw * .38, ch); space.lineTo(x + cw * .12, ch); space.closePath(); space.fill();
  }
  const bed = space.createLinearGradient(0, ch * .7, 0, ch);
  bed.addColorStop(0, '#b0b99300'); bed.addColorStop(1, '#adb38e35');
  space.fillStyle = bed; space.fillRect(0, ch * .7, cw, ch * .3);
  // Smooth stones and water plants frame the bottom edges, keeping the center clear.
  for (let i = 0; i < 13; i++) {
    const x = cw * (i / 12), y = ch * (.94 + Math.sin(i * 2.3) * .035);
    space.fillStyle = ['#80948744', '#9cab9040', '#4a6d6355'][i % 3];
    space.beginPath(); space.ellipse(x, y, 18 + (i % 4) * 9, 9 + (i % 3) * 4, i * .3, 0, Math.PI * 2); space.fill();
  }
  for (const edge of [0, 1]) {
    for (let i = 0; i < 6; i++) {
      const x = edge ? cw - i * 13 : i * 13;
      const sway = Math.sin(motion * .2 + i) * 9;
      const height = Math.min(ch * .28, 190) * (.6 + (i % 3) * .18);
      space.strokeStyle = i % 2 ? '#72938355' : '#416e624d';
      space.lineWidth = 3 + i % 3;
      space.beginPath(); space.moveTo(x, ch);
      space.bezierCurveTo(x - 18, ch - height * .4, x + sway + 18, ch - height * .7, x + sway, ch - height); space.stroke();
    }
  }
  pondFish.forEach(fish => drawPondFish(fish, seconds));
  // Broad, faint ripples suggest the surface above the fish.
  space.lineWidth = .7;
  for (let i = 0; i < 4; i++) {
    const x = cw * [.16, .8, .3, .71][i], y = ch * [.3, .64, .77, .15][i];
    const cycle = (motion * .07 + i * .24) % 1;
    space.strokeStyle = `rgba(218,231,206,${.13 * (1 - cycle)})`;
    for (let j = 0; j < 2; j++) {
      space.beginPath(); space.ellipse(x, y, (20 + cycle * 65 + j * 13) * Math.min(cw / 600, 1.5), 4 + cycle * 9 + j * 3, -.12, 0, Math.PI * 2); space.stroke();
    }
  }
  // A gentle vignette gives breathing text and controls a stable contrast.
  const shade = space.createLinearGradient(0, 0, 0, ch);
  shade.addColorStop(0, '#092d3b99'); shade.addColorStop(.24, '#092d3b12');
  shade.addColorStop(.7, '#092d3b00'); shade.addColorStop(1, '#092d3b88');
  space.fillStyle = shade; space.fillRect(0, 0, cw, ch);
  space.restore();
}
function drawWaterDrop(radius) {
  const water = space.createRadialGradient(-radius * .3, -radius * .4, 0, 0, 0, Math.max(radius, 1));
  water.addColorStop(0, '#e4f8eb30'); water.addColorStop(.7, '#b5e1d91c'); water.addColorStop(1, '#c3eee83d');
  space.fillStyle = water; space.strokeStyle = '#dcf5e580'; space.lineWidth = .85;
  space.beginPath();
  space.moveTo(0, -radius * 1.08);
  space.bezierCurveTo(radius * .3, -radius * .75, radius, -radius * .48, radius, radius * .12);
  space.bezierCurveTo(radius, radius * .66, radius * .6, radius, 0, radius);
  space.bezierCurveTo(-radius * .6, radius, -radius, radius * .66, -radius, radius * .12);
  space.bezierCurveTo(-radius, -radius * .48, -radius * .3, -radius * .75, 0, -radius * 1.08);
  space.closePath(); space.fill(); space.stroke();
  space.strokeStyle = '#effff0a0'; space.lineWidth = Math.max(.6, radius * .015); space.lineCap = 'round';
  space.beginPath(); space.ellipse(-radius * .07, radius * .1, radius * .75, radius * .73, -.15, Math.PI * 1.05, Math.PI * 1.4); space.stroke();
  space.strokeStyle = '#d8f4e652'; space.lineWidth = .65;
  space.beginPath(); space.ellipse(0, radius * .1, radius * .88, radius * .8, 0, .15, 1.05); space.stroke();
}
function drawPondRelease(seconds) {
  space.save();
  space.strokeStyle = `rgba(221,244,224,${Math.max(0, 1 - seconds / 1.8) * .55})`;
  space.lineWidth = .9;
  for (let i = 0; i < 3; i++) {
    const radius = 5 + seconds * 48 + i * 15;
    space.beginPath(); space.ellipse(cw / 2, ch * .4, radius, radius * .3, 0, 0, Math.PI * 2); space.stroke();
  }
  space.restore();
}
