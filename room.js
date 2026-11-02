'use strict';
// The room is local, with one controllable avatar and no simulated online users.
const roomText={ko:{welcome:'차 한 잔 놓고, 쉬어가요.',description:'마음이 머무는 자리에 앉아 보세요.',eyebrow:'A QUIET KOREAN TEA ROOM',place:'비 오는 다도방<span>THE QUIET TEA ROOM</span>',hint:'바닥을 눌러 걷기 · 자리를 눌러 앉아 생각하기',mobileHint:'옆으로 밀어 방 둘러보기 · 자리를 눌러 앉기',tea:'다탁',sofa:'소파',window:'창가',action:'에서 생각하기',walking:'자리로 천천히 걸어가고 있어요.',sitting:'편안히 앉고 있어요.',seated:'자리에 앉았습니다. 생각을 적어 보세요.',floor:'다도방 바닥. 클릭하거나 방향키로 이동할 수 있습니다.',scene:'한지 창호와 자연이 보이는 큰 창, 낮은 다탁과 방석, 소파가 있는 한국식 다도방',entry:'앉아서 생각하기',return:'다도방으로 돌아가기'},en:{welcome:'A little tea. A little stillness.',description:'Find a place where your mind can rest.',eyebrow:'A QUIET KOREAN TEA ROOM',place:'The quiet tea room<span>RAIN OUTSIDE, STILLNESS WITHIN</span>',hint:'Click the floor to walk · Choose a seat to reflect',mobileHint:'Swipe to explore · Choose a place to sit',tea:'Tea table',sofa:'Sofa',window:'Window',action:' · Reflect',walking:'Walking slowly to your seat.',sitting:'Settling into the seat.',seated:'Seated. Take a moment to write your thought.',floor:'Tea room floor. Click or use arrow keys to move.',scene:'A Korean tea room with paper lattice doors, a garden window, a low tea table, cushions and a sofa',entry:'Sit and reflect',return:'Back to the tea room'}};
const seats={tea:{label:'tea',approach:{x:790,y:860},position:{x:790,y:850},depth:850,hotspot:{x:780,y:650}},sofa:{label:'sofa',approach:{x:330,y:790},position:{x:330,y:700},depth:740,hotspot:{x:300,y:570}},window:{label:'window',approach:{x:1170,y:690},position:{x:1170,y:605},depth:640,hotspot:{x:1170,y:495}}};
const roomViewport=document.createElement('div');roomViewport.className='room-viewport';roomViewport.id='roomViewport';roomViewport.tabIndex=0;
const roomStage=document.createElement('div');roomStage.className='room-stage';roomStage.id='roomStage';roomViewport.append(roomStage);document.getElementById('sanctuary').insertBefore(roomViewport,document.querySelector('header'));
roomStage.innerHTML=`<svg class="room-art" viewBox="0 0 1440 1000" aria-labelledby="roomTitle" role="img"><title id="roomTitle"></title>
<defs>
<linearGradient id="roomWall" x2="0" y2="1"><stop stop-color="#e8e5d6"/><stop offset="1" stop-color="#cccdb7"/></linearGradient>
<linearGradient id="roomFloor" x2=".15" y2="1"><stop stop-color="#b2ad8b"/><stop offset="1" stop-color="#7f8065"/></linearGradient>
<linearGradient id="roomView" x2="0" y2="1"><stop stop-color="#d0ddca"/><stop offset="1" stop-color="#9db69c"/></linearGradient>
<pattern id="roomPaper" width="62" height="98" patternUnits="userSpaceOnUse"><path d="M0 0H62V98H0Z" fill="#dcdcc6"/><path d="M0 0H62V98H0ZM31 0V98M0 49H62" stroke="#a7a990" stroke-width="3" fill="none"/></pattern>
<pattern id="roomPlanks" width="240" height="92" patternUnits="userSpaceOnUse"><path d="M0 0H240V92H0Z" fill="none" stroke="#656a4c40" stroke-width="2"/><path d="M8 24Q90 14 230 23M3 30Q126 23 235 32M40 76Q138 68 232 73" fill="none" stroke="#d8cfac30"/></pattern>
<clipPath id="gardenClip"><rect x="495" y="130" width="790" height="365" rx="2"/></clipPath>
<radialGradient id="roomLight"><stop stop-color="#f3f1d4" stop-opacity=".33"/><stop offset="1" stop-color="#f3f1d4" stop-opacity="0"/></radialGradient>
</defs>
<path d="M50 50H1390V552H50Z" fill="url(#roomWall)"/>
<path d="M50 552H1390L1440 1000H0Z" fill="url(#roomFloor)"/>
<path d="M50 552H1390L1440 1000H0Z" fill="url(#roomPlanks)"/>
<path d="M60 50H1380V80H60Z" fill="#636e52"/><path d="M65 80H1375V91H65Z" fill="#a6a68a"/>
<!-- Hanji sliding doors and warm timber frame. -->
<path d="M100 135H420V495H100Z" fill="#92997d"/><path d="M110 147H254V480H110ZM267 147H410V480H267Z" fill="url(#roomPaper)"/>
<path d="M255 142H267V487H255Z" fill="#92997d"/><circle cx="249" cy="336" r="4" fill="#646f55"/><circle cx="275" cy="336" r="4" fill="#646f55"/>
<!-- The window frames the existing muted green mountain-and-pond palette. -->
<g clip-path="url(#gardenClip)"><path d="M495 130H1285V495H495Z" fill="url(#roomView)"/>
<path d="M470 320Q600 205 722 286T933 263T1310 261V510H470Z" fill="#9eb79a" opacity=".65"/>
<path d="M480 370Q610 289 760 343T1010 316T1310 330V510H480Z" fill="#87a487" opacity=".65"/>
<path d="M470 442Q650 398 825 435T1310 409V520H470Z" fill="#799879"/>
<ellipse cx="913" cy="469" rx="264" ry="46" fill="#b0c2a5"/>
<g fill="none" stroke="#d2ddbf" opacity=".5"><ellipse cx="850" cy="464" rx="35" ry="4"/><ellipse cx="1095" cy="481" rx="28" ry="3"/></g>
<path d="M1215 500q-25-100-5-222l-25-74 12-5 28 79q-12 128 13 222Z" fill="#627c5d"/>
<g fill="#78946c"><ellipse cx="1175" cy="237" rx="89" ry="28"/><ellipse cx="1265" cy="276" rx="92" ry="30"/><ellipse cx="1200" cy="318" rx="72" ry="24"/></g>
<g id="windowRain" stroke="#eaf0d6" stroke-width="1" opacity=".3"></g></g>
<path d="M482 116H1299V135H482ZM482 491H1299V512H482ZM482 116H499V510H482ZM1280 116H1299V510H1280ZM884 130H897V496H884Z" fill="#7b8568"/>
<path d="M470 512H1310V527H470Z" fill="#a6aa8a"/>
<!-- Ceramic vase, branches, paper lamp, and a small tea cabinet. -->
<path d="M104 491H397V555H104Z" fill="#8e9676"/><path d="M104 489H397V502H104Z" fill="#727e60"/><path d="M247 510v38" stroke="#69795b"/><circle cx="232" cy="528" r="3" fill="#c3c5a8"/><circle cx="263" cy="528" r="3" fill="#c3c5a8"/>
<path d="M158 448Q150 480 171 487H192Q210 475 201 448Z" fill="#c3c6ac"/><ellipse cx="180" cy="449" rx="21" ry="5" fill="#8c9e80"/>
<path d="M179 451 167 386m12 48 27-29m-34-2-17-18" fill="none" stroke="#718362" stroke-width="3"/><g fill="#94a57f"><ellipse cx="159" cy="386" rx="13" ry="5" transform="rotate(30 159 386)"/><ellipse cx="206" cy="404" rx="12" ry="5" transform="rotate(-30 206 404)"/></g>
<path d="M1355 350V553" stroke="#7b8568" stroke-width="5"/><path d="M1320 331Q1355 293 1390 331L1398 396Q1355 416 1312 396Z" fill="#e0ddbe" stroke="#bcbfa0"/><path d="M1343 315v89m25-89v89" stroke="#b1b797" opacity=".5"/>
<ellipse cx="920" cy="645" rx="450" ry="200" fill="url(#roomLight)"/>
<!-- Depth-sorted furniture and avatar are placed in this layer. -->
<g id="roomDepth">
<g data-depth="735" id="roomSofa"><ellipse cx="315" cy="735" rx="193" ry="24" fill="#58694c25"/><path d="M140 625Q140 605 160 603H464Q485 605 486 625V702H140Z" fill="#8d9b7e"/><path d="M150 662H476V717H150Z" fill="#b3bba0"/><path d="M140 687H486V729H140Z" fill="#9fae90"/><path d="M123 644Q123 631 140 631H158V729H123ZM469 632H487Q504 632 504 648V729H469Z" fill="#899d7b"/><path d="M148 730v14m330-14v14" stroke="#657653" stroke-width="8"/><path d="M203 626q20-14 47-6l12 42-58 5Z" fill="#d0cfb3"/><path d="M378 620q23-5 48 8l-4 40-58-9Z" fill="#a1af92"/><path d="M311 664v45" stroke="#899a7b"/></g>
<g data-depth="790" id="roomTea"><ellipse cx="790" cy="793" rx="194" ry="28" fill="#53634b20"/><path d="M625 690H956V759H625Z" fill="#8d8b69"/><path d="M641 754v45h15v-45m269 0v45h15v-45" fill="#667451"/><path d="M616 684Q789 666 964 684V705Q790 720 616 705Z" fill="#a5a182"/><path d="M632 689Q780 680 947 689" fill="none" stroke="#cdc4a0"/><path d="M751 681h88v13h-88Z" fill="#69795b"/><ellipse cx="794" cy="675" rx="23" ry="8" fill="#cdd0b6"/><path d="M775 658v15q20 13 39 0v-15" fill="#c2c9ac"/><ellipse cx="794" cy="658" rx="19" ry="6" fill="#9baa8c"/><path d="M812 660q21-4 18 8l-18 3" fill="none" stroke="#c2c9ac" stroke-width="5"/><ellipse cx="859" cy="690" rx="13" ry="4" fill="#748664"/><path d="M848 677q0 13 11 13t11-13" fill="#dedac0"/><ellipse cx="859" cy="677" rx="11" ry="3" fill="#899d79"/><path d="M725 818q62-14 125 0l4 37q-63 14-133 0Z" fill="#a0ad88"/><path d="M733 820q54-9 109 0" fill="none" stroke="#c8cbb0"/></g>
<g data-depth="630" id="roomWindowSeat"><ellipse cx="1169" cy="635" rx="154" ry="18" fill="#52634c25"/><path d="M1025 555H1315V618H1025Z" fill="#869573"/><path d="M1014 547H1326V568H1014Z" fill="#a7ad8b"/><path d="M1040 540q70-12 130-2l6 22-137 1Z" fill="#c2c5a4"/><path d="M1194 539q48-9 96 0l8 22-106-1Z" fill="#b7c0a0"/><path d="M1045 614v20m250-20v20" stroke="#667954" stroke-width="9"/></g>
<g id="roomAvatar" data-depth="900" aria-hidden="true"><ellipse id="avatarShadow" cx="0" cy="0" rx="24" ry="7" fill="#3e574339"/><path id="avatarLegs" fill="none" stroke="#526852" stroke-width="12" stroke-linecap="round"/><g id="avatarUpper"><path d="M-17-58Q0-65 17-58L23-26Q0-16-23-26Z" fill="#b8bba0"/><path d="M-16-53-24-29M16-53 24-29" stroke="#b8bba0" stroke-width="10" stroke-linecap="round"/><path d="M-6-69v11q6 5 12 0v-11" fill="#b4a58c"/><ellipse cx="0" cy="-79" rx="13" ry="16" fill="#bfb097"/><path d="M-13-78q-4-23 13-23 18 0 13 27l-7-10q-12 4-18-3Z" fill="#4c5847"/></g></g>
</g>
<path d="M50 50H69V555H50ZM1371 50H1390V555H1371Z" fill="#7e8969"/><path d="M50 552H1390" stroke="#7e8969" stroke-width="10"/>
</svg>`;
const toolbar=document.createElement('div');toolbar.className='room-toolbar';toolbar.id='roomToolbar';toolbar.setAttribute('role','group');
const hint=document.createElement('div');hint.className='room-hint';
const status=document.createElement('div');status.className='room-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
document.getElementById('sanctuary').append(toolbar,hint,status);
for(const [key,seat]of Object.entries(seats)){
 const button=document.createElement('button');button.className='seat-hotspot';button.dataset.seat=key;button.type='button';button.style.left=seat.hotspot.x/14.4+'%';button.style.top=seat.hotspot.y/10+'%';button.addEventListener('click',()=>chooseSeat(key));roomStage.append(button);
 const shortcut=document.createElement('button');shortcut.dataset.seat=key;shortcut.type='button';shortcut.addEventListener('click',()=>chooseSeat(key));toolbar.append(shortcut);
}
let actor={x:760,y:920},route=[],roomState='idle',selectedSeat=null,sitProgress=0,sitStarted=0,roomFrame=null,roomLast=0,roomTravel=0,roomGeneration=0,pendingSeat=null;
const avatar=document.getElementById('roomAvatar'),upper=document.getElementById('avatarUpper'),legs=document.getElementById('avatarLegs');
const depthLayer=document.getElementById('roomDepth');
const obstacles=[{x1:108,x2:520,y1:590,y2:750},{x1:600,x2:980,y1:670,y2:805},{x1:1000,x2:1340,y1:530,y2:650}];
function walkable(x,y){return x>=85&&x<=1355&&y>=555&&y<=950&&!obstacles.some(o=>x>=o.x1&&x<=o.x2&&y>=o.y1&&y<=o.y2)}
// A small four-neighbor grid avoids cutting through furniture or across corners.
function findPath(from,to){
 const nodes=[];for(let y=560;y<=940;y+=20)for(let x=100;x<=1340;x+=20)if(walkable(x,y))nodes.push({x,y});
 const nearest=p=>nodes.reduce((best,n)=>Math.hypot(n.x-p.x,n.y-p.y)<Math.hypot(best.x-p.x,best.y-p.y)?n:best,nodes[0]);
 const start=nearest(from),end=nearest(to),key=n=>n.x+','+n.y,map=new Map(nodes.map(n=>[key(n),n]));
 const queue=[start],parents=new Map([[key(start),null]]);let cursor=0;
 while(cursor<queue.length){const n=queue[cursor++];if(n===end)break;for(const [dx,dy]of [[20,0],[-20,0],[0,20],[0,-20]]){const id=(n.x+dx)+','+(n.y+dy);if(map.has(id)&&!parents.has(id)){parents.set(id,n);queue.push(map.get(id))}}}
 if(!parents.has(key(end)))return [];
 const path=[];let n=end;while(n){path.push({x:n.x,y:n.y});n=parents.get(key(n))}path.reverse();
 if(walkable(to.x,to.y))path.push({...to});return path;
}
function roomTranslate(){
 const c=roomText[language];document.getElementById('welcome').textContent=c.welcome;document.querySelector('.description').textContent=c.description;document.querySelector('.eyebrow').textContent=c.eyebrow;document.querySelector('.place').innerHTML=c.place;document.getElementById('roomTitle').textContent=c.scene;document.getElementById('sanctuary').setAttribute('aria-label',c.scene);roomViewport.setAttribute('aria-label',c.floor);toolbar.setAttribute('aria-label',language==='ko'?'생각하기 자리':'Places to reflect');hint.textContent=innerWidth<700?c.mobileHint:c.hint;
 document.querySelectorAll('[data-seat]').forEach(button=>{const key=button.dataset.seat;button.textContent=c[key]+(button.classList.contains('seat-hotspot')?c.action:'');button.setAttribute('aria-label',c[key]+c.action);button.setAttribute('aria-pressed',String(selectedSeat===key))});
 document.getElementById('openRitual').textContent=c.entry;
 for(const id of ['leaveJourney','returnVeranda'])document.getElementById(id).textContent=c.return;
 document.querySelectorAll('#ritualIntro').forEach(el=>el.innerHTML=language==='ko'?'이 자리에 잠시, 마음을 내려놓아요.<br>적어 둔 생각은 60초 동안 조용히 멀어집니다.':'Rest your mind here for a moment.<br>Your thought will gently drift away over 60 seconds.');
}
function sizeRoom(){const w=roomViewport.clientWidth,h=roomViewport.clientHeight;const stageWidth=w<700?800:Math.min(w,Math.max(700,h*1.44));roomStage.style.width=stageWidth+'px';roomStage.style.height=stageWidth/1.44+'px';followActor();roomTranslate()}
function followActor(){const x=actor.x/1440*roomStage.clientWidth,y=actor.y/1000*roomStage.clientHeight;roomViewport.scrollLeft=Math.max(0,x-roomViewport.clientWidth/2);roomViewport.scrollTop=Math.max(0,y-roomViewport.clientHeight*.72)}
function paintActor(time){
 avatar.setAttribute('transform',`translate(${actor.x} ${actor.y})`);
 const p=sitProgress,bob=roomState==='walking'&&!reduced.matches?Math.sin(roomTravel*.22)*1.5:0;
 upper.setAttribute('transform',`translate(0 ${p*20+bob})`);
 if(p>0){legs.setAttribute('d',`M-9 ${-23+p*13}Q${-13-p*12} ${-8+p*7} ${-10-p*17} ${-3}M9 ${-23+p*13}Q${13+p*12} ${-8+p*7} ${10+p*17} -3`)}
 else{const stride=roomState==='walking'&&!reduced.matches?Math.sin(roomTravel*.2)*7:0;legs.setAttribute('d',`M-8-24-9 ${-3+stride}M8-24 9 ${-3-stride}`)}
 avatar.dataset.depth=roomState==='seated'||roomState==='sitting'?seats[selectedSeat].depth:actor.y;
 [...depthLayer.children].sort((a,b)=>Number(a.dataset.depth)-Number(b.dataset.depth)).forEach(node=>depthLayer.append(node));
}
function startRoomFrame(){if(roomFrame===null){roomLast=0;roomFrame=requestAnimationFrame(roomTick)}}
function roomTick(now){roomFrame=null;const dt=roomLast?Math.min((now-roomLast)/1000,.05):0;roomLast=now;
 if(roomState==='walking'){
  let budget=dt*185;
  while(route.length&&budget>0){const next=route[0],distance=Math.hypot(next.x-actor.x,next.y-actor.y);if(distance<=budget){actor={...next};route.shift();budget-=distance;roomTravel+=distance}else{actor.x+=(next.x-actor.x)/distance*budget;actor.y+=(next.y-actor.y)/distance*budget;roomTravel+=budget;budget=0}}
  followActor();
  if(!route.length){if(pendingSeat){roomState='sitting';sitStarted=now;status.textContent=roomText[language].sitting}else roomState='idle'}
 }
 if(roomState==='sitting'){
  const seat=seats[selectedSeat],duration=reduced.matches?0:700;
  sitProgress=duration?Math.min((now-sitStarted)/duration,1):1;
  const eased=1-Math.pow(1-sitProgress,3);actor.x=seat.approach.x+(seat.position.x-seat.approach.x)*eased;actor.y=seat.approach.y+(seat.position.y-seat.approach.y)*eased;
  followActor();
  if(sitProgress>=1){roomState='seated';pendingSeat=null;status.textContent=roomText[language].seated;paintActor(now);ritualTranslate();roomTranslate();ritualDialog.showModal()}
 }
 paintActor(now);
 if(roomState==='walking'||roomState==='sitting')roomFrame=requestAnimationFrame(roomTick);
}
function standUp(){if(selectedSeat&&(roomState==='seated'||roomState==='sitting'))actor={...seats[selectedSeat].approach};sitProgress=0;roomState='idle';selectedSeat=null;pendingSeat=null}
function chooseSeat(key){if(!seats[key]||!journey.hidden||ritualDialog.open)return;standUp();selectedSeat=key;pendingSeat=key;route=findPath(actor,seats[key].approach);roomState='walking';status.textContent=roomText[language].walking;roomTranslate();startRoomFrame()}
window.requestRoomSeat=()=>{if(roomState==='seated'){ritualTranslate();roomTranslate();ritualDialog.showModal()}else chooseSeat('tea')};
roomStage.addEventListener('click',event=>{if(event.target.closest('button')||!journey.hidden||ritualDialog.open)return;const rect=roomStage.getBoundingClientRect(),point={x:(event.clientX-rect.left)/rect.width*1440,y:(event.clientY-rect.top)/rect.height*1000};if(!walkable(point.x,point.y))return;standUp();route=findPath(actor,point);roomState='walking';roomTranslate();roomViewport.focus({preventScroll:true});startRoomFrame()});
roomViewport.addEventListener('keydown',event=>{if(event.target.closest('button'))return;const moves={ArrowLeft:[-60,0],ArrowRight:[60,0],ArrowUp:[0,-60],ArrowDown:[0,60],a:[-60,0],d:[60,0],w:[0,-60],s:[0,60]};const move=moves[event.key];if(!move||ritualDialog.open||!journey.hidden)return;event.preventDefault();standUp();const target={x:actor.x+move[0],y:actor.y+move[1]};if(walkable(target.x,target.y)){route=findPath(actor,target);roomState='walking';roomTranslate();startRoomFrame()}});
document.getElementById('language').addEventListener('click',roomTranslate);
window.addEventListener('resize',sizeRoom);
ritualDialog.addEventListener('close',roomTranslate);
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(roomFrame!==null)cancelAnimationFrame(roomFrame);roomFrame=null}else if(roomState==='walking'||roomState==='sitting')startRoomFrame()});
// Rain remains outside the glass instead of falling through the room.
const rainSvg=document.getElementById('windowRain');for(let i=0;i<45;i++){const line=document.createElementNS('http://www.w3.org/2000/svg','path');const x=500+(i*137)%780,y=140+(i*83)%340;line.setAttribute('d',`M${x} ${y}l-3 14`);if(!reduced.matches){const motion=document.createElementNS('http://www.w3.org/2000/svg','animateTransform');motion.setAttribute('attributeName','transform');motion.setAttribute('type','translate');motion.setAttribute('values','0 -12;-5 18');motion.setAttribute('dur',(2+i%4)+'s');motion.setAttribute('repeatCount','indefinite');line.append(motion)}rainSvg.append(line)}
sizeRoom();paintActor(0);
