'use strict';
// The optional ritual leaves the veranda's no-task entry intact.
const ritualCopy={ko:{entry:'생각 내려놓기',title:'잠깐, 내려놓고 싶은 생각',intro:'한 줄만 적어도 괜찮아요.<br>60초 동안, 생각이 조용히 멀어집니다.',star:'별빛',pebble:'연못 · 물방울',placeholder:'지금 마음에 남아 있는 생각을 적어 주세요.',start:'천천히 흘려보내기',privacy:'입력은 전송하거나 저장하지 않으며, 끝나거나 나가면 비웁니다.',close:'닫기',leave:'툇마루로 돌아가기',on:'소리 켜기',off:'소리 끄기',done:'생각이 멀어졌습니다.',doneSub:'마음을 다 비우지 못해도 괜찮아요.<br>이제 다시, 비가 오는 툇마루로.',return:'비 오는 툇마루로',cues:[['천천히 숨을 들이쉬세요.','생각을 없애려 애쓰지 않아도 괜찮아요.'],['잠깐, 편안히 머물러요.','숨을 참는 게 불편하면 자연스럽게 쉬세요.'],['부드럽게 숨을 내쉬세요.','어깨에 남은 힘을 조금 내려놓아요.']],closing:['마지막 숨을 가볍게 내쉬세요.','생각이 멀어지는 모습을 바라보세요.']},en:{entry:'Let a thought go',title:'Something on your mind?',intro:'A single line is enough.<br>Let your thought drift away over 60 seconds.',star:'Starlight',pebble:'Pond · Water drop',placeholder:'Write a thought that is weighing on you.',start:'Let it drift away',privacy:'Your words are not sent or saved. They are cleared when you finish or leave.',close:'Close',leave:'Back to the veranda',on:'Sound on',off:'Sound off',done:'Your thought has drifted away.',doneSub:'It’s okay if your mind isn’t completely clear.<br>The rainy veranda is still here.',return:'Return to the rain',cues:[['Slowly breathe in.','You don’t have to force this thought away.'],['Rest here for a moment.','If holding your breath feels uncomfortable, breathe naturally.'],['Gently breathe out.','Let a little tension leave your shoulders.']],closing:['Let out one last, gentle breath.','Watch your thought drift into the distance.']}};
document.body.insertAdjacentHTML('beforeend',`<dialog class="shadow-2xl backdrop-blur-2xl" id="ritual" aria-labelledby="ritualTitle"><div class="ritual-card"><button class="ritual-close" id="closeRitual" type="button">×</button><h2 class="tracking-tight font-light" id="ritualTitle"></h2><p id="ritualIntro"></p><div class="modes" role="group" aria-label="Capsule"><button id="starMode" type="button" aria-pressed="true"></button><button id="pebbleMode" type="button" aria-pressed="false"></button></div><form id="ritualForm"><textarea class="ritual-input" id="thought" maxlength="140" rows="3" required></textarea><div class="ritual-count" id="thoughtCount">0 / 140</div><button class="ritual-start" id="beginRitual" type="submit" disabled></button></form><p class="ritual-privacy" id="ritualPrivacy"></p></div></dialog><section id="journey" hidden aria-label="60 second breathing space"><canvas id="cosmos" aria-hidden="true"></canvas><div class="journey-controls"><button id="leaveJourney" type="button"></button><button id="journeySound" type="button" aria-pressed="false"></button></div><div class="journey-top" id="journeyTop"><small id="seconds" aria-hidden="true">60s</small><h2 class="cue" id="breathe" aria-live="polite"></h2></div><div class="journey-bottom cue" id="breatheSub"></div><div class="ritual-complete" id="ritualDone" hidden><h2 id="doneTitle" tabindex="-1"></h2><p id="doneSub"></p><button class="ritual-return" id="returnVeranda" type="button"></button></div></section>`);
const pondCopy={
 ko:{cues:[['천천히 숨을 들이쉬세요.','물고기들이 지나가는 모습을 편안히 바라보세요.'],['잠깐, 편안히 머물러요.','숨을 참는 게 불편하면 자연스럽게 쉬세요.'],['부드럽게 숨을 내쉬세요.','잔잔한 물결에 생각을 가만히 맡겨 보세요.']],closing:['마지막 숨을 가볍게 내쉬세요.','작은 물방울이 물속으로 조용히 스며듭니다.'],done:'생각이 물결 속으로 잦아들었어요.',doneSub:'물고기들은 여전히 느긋하게 헤엄치고 있어요.<br>당신도 잠시, 편안히 머물러요.',label:'물고기가 헤엄치는 평온한 연못 속 60초 호흡 공간'},
 en:{cues:[['Slowly breathe in.','Watch the fish gently swim past.'],['Rest here for a moment.','If holding your breath feels uncomfortable, breathe naturally.'],['Gently breathe out.','Let the quiet water carry your thought.']],closing:['Let out one last, gentle breath.','The little water drop quietly merges with the pond.'],done:'Your thought settles into the water.',doneSub:'The fish are still swimming peacefully.<br>You can rest here for a moment, too.',label:'60 second breathing space in a peaceful pond with slowly swimming fish'}
};
const ritualDialog=document.getElementById('ritual'),thoughtInput=document.getElementById('thought'),journey=document.getElementById('journey');
const cosmos=document.getElementById('cosmos'),space=cosmos.getContext('2d');
let capsule='star',thought='',running=false,started=0,ritualFrame=null,ritualDeadline=null,cueFade=null,cueKey='',cw=0,ch=0,ritualBus=null,droneNodes=[],completionParticles=[],ritualGeneration=0;
const stars=Array.from({length:85},()=>({x:Math.random(),y:Math.random(),r:.4+Math.random()*1.1}));
function ritualTranslate(){const c=ritualCopy[language];const ids={openRitual:'entry',ritualTitle:'title',ritualIntro:'intro',starMode:'star',pebbleMode:'pebble',beginRitual:'start',ritualPrivacy:'privacy',leaveJourney:'leave',doneTitle:'done',doneSub:'doneSub',returnVeranda:'return'};for(const [id,key]of Object.entries(ids))document.getElementById(id).innerHTML=c[key];thoughtInput.placeholder=c.placeholder;thoughtInput.setAttribute('aria-label',c.title);document.getElementById('closeRitual').setAttribute('aria-label',c.close);document.getElementById('journeySound').textContent=c[soundOn?'off':'on'];document.getElementById('journeySound').setAttribute('aria-pressed',String(soundOn));document.querySelector('.modes').setAttribute('aria-label',language==='ko'?'생각을 담을 모양':'Thought capsule');journey.setAttribute('aria-label',capsule==='pebble'?pondCopy[language].label:(language==='ko'?'60초 호흡 공간':'60 second breathing space'));if(capsule==='pebble'){document.getElementById('doneTitle').textContent=pondCopy[language].done;document.getElementById('doneSub').innerHTML=pondCopy[language].doneSub;}if(running)updateCue(Math.min((Date.now()-started)/1000,60),true)}
function resizeCosmos(){cw=innerWidth;ch=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);cosmos.width=Math.round(cw*dpr);cosmos.height=Math.round(ch*dpr);space.setTransform(dpr,0,0,dpr,0,0)}
window.addEventListener('resize',resizeCosmos);
document.getElementById('language').addEventListener('click',ritualTranslate);
document.getElementById('openRitual').addEventListener('click',()=>{ritualTranslate();ritualDialog.showModal()});
function clearWords(){thought='';thoughtInput.value='';document.getElementById('thoughtCount').textContent='0 / 140';document.getElementById('beginRitual').disabled=true}
ritualDialog.addEventListener('close',()=>{if(!running)clearWords()});
document.getElementById('closeRitual').addEventListener('click',()=>ritualDialog.close());
thoughtInput.addEventListener('input',()=>{document.getElementById('thoughtCount').textContent=`${thoughtInput.value.length} / 140`;document.getElementById('beginRitual').disabled=!thoughtInput.value.trim()});
for(const mode of ['star','pebble'])document.getElementById(mode+'Mode').addEventListener('click',()=>{capsule=mode;for(const m of ['star','pebble'])document.getElementById(m+'Mode').setAttribute('aria-pressed',String(m===mode))});
function tone(frequency,delay,duration,level){if(!audio||!ritualBus)return;const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(0,audio.currentTime+delay);gain.gain.linearRampToValueAtTime(level,audio.currentTime+delay+.02);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+delay+duration);osc.connect(gain);gain.connect(ritualBus);osc.start(audio.currentTime+delay);osc.stop(audio.currentTime+delay+duration+.1);osc.onended=()=>{osc.disconnect();gain.disconnect()}}
function stopDrone(){for(const node of droneNodes){try{node.stop()}catch{}node.disconnect()}droneNodes=[];if(ritualBus){ritualBus.disconnect();ritualBus=null}}
function setupRitualSound(chime=false){if(!soundOn)return;try{if(!audio)prepareAudio();audio.resume().catch(()=>{});}catch{return;}if(!ritualBus){ritualBus=audio.createGain();ritualBus.gain.value=.4;ritualBus.connect(audio.destination);for(const f of [130.81,196,261.63]){const osc=audio.createOscillator(),gain=audio.createGain();osc.frequency.value=f;gain.gain.value=.025;osc.connect(gain);gain.connect(ritualBus);osc.start();droneNodes.push(osc)}}if(chime){tone(523.25,0,4,.2);tone(1046.5,.02,3,.07);tone(1569.75,.03,2,.025)}}
// Respect the existing opt-in state: starting the ritual never unmutes audio.
document.getElementById('journeySound').addEventListener('click',()=>setAmbientSound(!ambientWanted));
document.addEventListener('ambientsoundchange',()=>{
 if(soundOn&&running){
  try{if(!audio)prepareAudio();audio.resume().then(()=>{if(soundOn&&running){setupRitualSound();if(ritualBus)ritualBus.gain.setTargetAtTime(.4,audio.currentTime,.1);}}).catch(()=>{});}catch{}
 }
 if(ritualBus&&!soundOn)ritualBus.gain.setTargetAtTime(0,audio.currentTime,.1);
});
const journeySelect=document.createElement('select');journeySelect.className='journey-track';journeySelect.id='journeyTrack';
document.querySelector('.journey-controls').insertBefore(journeySelect,document.getElementById('journeySound'));
journeySelect.addEventListener('change',()=>selectAmbientTrack(journeySelect.value));
translateTracks();

function cueFor(elapsed){const c=capsule==='pebble'?pondCopy[language]:ritualCopy[language];if(elapsed>=54)return c.closing;const phase=elapsed%12;return c.cues[phase<4?0:phase<6?1:2]}
function updateCue(elapsed,immediate=false){const pair=cueFor(elapsed),key=language+pair[0];if(key===cueKey&&!immediate)return;cueKey=key;clearTimeout(cueFade);const title=document.getElementById('breathe'),sub=document.getElementById('breatheSub');const set=()=>{title.textContent=pair[0];sub.textContent=pair[1];title.classList.remove('fading');sub.classList.remove('fading')};if(immediate||reduced.matches){set()}else{title.classList.add('fading');sub.classList.add('fading');cueFade=setTimeout(set,600)}}
function drawSpace(elapsed){
 space.clearRect(0,0,cw,ch);
 const pond=capsule==='pebble';
 if(pond){drawPondBackground(elapsed);}else{
  for(const star of stars){space.fillStyle='#d1e0ea';space.globalAlpha=.25+star.r*.16;space.beginPath();space.arc(star.x*cw,star.y*ch,star.r,0,Math.PI*2);space.fill();}
 }
 space.globalAlpha=1;
 const progress=Math.min(elapsed/60,1);
 if(progress>=1)return;
 const breath=reduced.matches?1:1+.025*Math.sin(elapsed*Math.PI/6);
 const radius=Math.min(cw*.29,ch*.21,135)*Math.pow(1-progress,1.15)*breath;
 const x=cw/2,y=ch/2-progress*ch*.1;
 space.save();space.translate(x,y);
 const glow=space.createRadialGradient(0,0,0,0,0,Math.max(radius*1.9,1));
 glow.addColorStop(0,pond?'#bbe3ce18':'#b9cce53b');glow.addColorStop(1,'#c7d8ed00');
 space.fillStyle=glow;space.beginPath();space.arc(0,0,radius*1.9,0,Math.PI*2);space.fill();
 if(pond){drawWaterDrop(radius);}else{
  space.fillStyle='#abc5e61a';space.strokeStyle='#b8d4ed90';space.beginPath();space.arc(0,0,radius,0,Math.PI*2);space.fill();space.stroke();
 }
 space.globalAlpha=Math.min(1,(1-progress)*3);space.fillStyle='#effaf0';
 const font=Math.max(1,Math.min(14,radius*.13));space.font=`${font}px Arial, sans-serif`;space.textAlign='center';space.textBaseline='middle';
 // Keep text inside the drop; never interpret user input as HTML.
 const lines=[];let line='';
 for(const char of Array.from(thought)){
  if(char==='\n'){lines.push(line);line='';continue;}
  if(space.measureText(line+char).width>radius*1.5&&line){lines.push(line);line=char;}else{line+=char;}
 }
 if(line)lines.push(line);
 const visible=lines.slice(0,5);if(lines.length>5)visible[4]=visible[4].slice(0,-1)+'…';
 space.shadowColor='#173d40';space.shadowBlur=pond?6:0;
 visible.forEach((text,i)=>space.fillText(text,0,(i-(visible.length-1)/2)*font*1.5));space.restore();
}
function renderRitual(){if(!running)return;const elapsed=Math.min((Date.now()-started)/1000,60);document.getElementById('seconds').textContent=`${Math.ceil(60-elapsed)}s`;updateCue(elapsed);drawSpace(elapsed);if(elapsed>=60){finishRitual();return}ritualFrame=requestAnimationFrame(renderRitual)}
function finishRitual(){if(!running)return;running=false;clearTimeout(ritualDeadline);clearTimeout(cueFade);cancelAnimationFrame(ritualFrame);clearWords();drawSpace(60);document.getElementById('seconds').textContent='0s';document.getElementById('journeyTop').hidden=true;document.getElementById('breatheSub').hidden=true;if(soundOn){[1046.5,1318.51,1567.98,2093].forEach((f,i)=>tone(f,i*.17,1.8,.07))}const generation=ritualGeneration;completionParticles=Array.from({length:38},()=>({a:Math.random()*Math.PI*2,s:10+Math.random()*55}));const endStart=performance.now();function scatter(now){if(generation!==ritualGeneration)return;const t=(now-endStart)/1000;drawSpace(60);if(!reduced.matches&&t<1.8){if(capsule==='pebble'){drawPondRelease(t);}else{space.fillStyle='#c6deeb';space.globalAlpha=Math.max(0,1-t/1.8);for(const p of completionParticles){space.beginPath();space.arc(cw/2+Math.cos(p.a)*p.s*t,ch*.4+Math.sin(p.a)*p.s*t,1.2,0,Math.PI*2);space.fill()}space.globalAlpha=1;}ritualFrame=requestAnimationFrame(scatter)}else{completionParticles=[];stopDrone();document.getElementById('ritualDone').hidden=false;document.getElementById('doneTitle').focus()}}ritualFrame=requestAnimationFrame(scatter)}
function leaveRitual(){ritualGeneration++;running=false;clearTimeout(ritualDeadline);clearTimeout(cueFade);cancelAnimationFrame(ritualFrame);stopDrone();clearWords();completionParticles=[];space.clearRect(0,0,cw,ch);journey.hidden=true;document.getElementById('sanctuary').inert=false;document.getElementById('viewToggle').inert=false;document.getElementById('openRitual').inert=false;document.getElementById('openRitual').focus()}
document.getElementById('leaveJourney').addEventListener('click',leaveRitual);document.getElementById('returnVeranda').addEventListener('click',leaveRitual);document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!journey.hidden){event.preventDefault();leaveRitual()}});
document.getElementById('ritualForm').addEventListener('submit',event=>{event.preventDefault();if(!thoughtInput.value.trim())return;const text=thoughtInput.value.trim();ritualDialog.close();clearWords();thought=text;thoughtInput.blur();running=true;ritualGeneration++;started=Date.now();cueKey='';journey.hidden=false;journey.classList.toggle('pond-mode',capsule==='pebble');document.getElementById('sanctuary').inert=true;document.getElementById('viewToggle').inert=true;document.getElementById('openRitual').inert=true;document.getElementById('ritualDone').hidden=true;document.getElementById('journeyTop').hidden=false;document.getElementById('breatheSub').hidden=false;resizeCosmos();ritualTranslate();setupRitualSound(true);renderRitual();ritualDeadline=setTimeout(finishRitual,60000);document.getElementById('leaveJourney').focus()});
document.addEventListener('visibilitychange',()=>{if(!running)return;if(document.hidden)cancelAnimationFrame(ritualFrame);else renderRitual()});
// Keep keyboard focus within the active breathing space.
journey.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const items=[...journey.querySelectorAll('button')].filter(el=>!el.closest('[hidden]'));const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}});
ritualTranslate();
