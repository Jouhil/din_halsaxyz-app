import { initRouter } from './router.js';
import { state } from './state.js';
import { getItem, setItem, loadJSON, saveJSON } from './storage.js';
import { loadDataLibraries } from './data/dataLoader.js';
import { pickByModeWithHistory as enginePickByMode, hasThemeMatch as engineThemeMatch } from './engines/matchingEngine.js';
import { getRecentIds as getRecentIdsFromRotation } from './engines/rotationEngine.js';
import { initCheckinFlow } from './flows/checkinFlow.js';
import { init as initToolsModule } from './modules/toolsModule.js';
import { init as initPerspectiveModule } from './modules/perspectiveModule.js';
import { init as initStatsModule } from './modules/statsModule.js';
import { init as initSettingsModule } from './modules/settingsModule.js';
import { initGuideOverlay, openGuide } from './ui/helpOverlay.js';

let checkinFlowApi = null;

// ══════════════════════════════════════════
//  KONSTANTER & URLS
// ══════════════════════════════════════════
const LIB_URL      = "data/library.v1.json?v=1";
const CLOSING_URL  = "data/closing.v1.json?v=1";

// ══════════════════════════════════════════
//  FALLBACK DATA (minimalt inbyggt)
// ══════════════════════════════════════════
const FALLBACK_LIB = {
  gratitude: [
    {id:"g001",text:"Jag är tacksam för en person som fick mig att le idag.",needs:["humör"],mode:"pepp",intensity:1,durationSec:10,audience:"neutral"},
    {id:"g002",text:"Jag är tacksam för något gott jag åt eller drack idag.",needs:["humör"],mode:"lugn",intensity:1,durationSec:10,audience:"neutral"},
    {id:"g003",text:"Jag är tacksam för att min kropp bar mig igenom dagen.",needs:["humör","energi"],mode:"lugn",intensity:1,durationSec:10,audience:"neutral"}
  ],
  affirmations: [
    {id:"a001",text:"Jag är tillräcklig, precis som jag är, just nu.",needs:["tankar","stress"],mode:"lugn",intensity:1,durationSec:10,audience:"neutral"},
    {id:"a002",text:"Jag tillåter mig att ta en paus och ladda om.",needs:["energi","stress"],mode:"lugn",intensity:1,durationSec:10,audience:"neutral"},
    {id:"a003",text:"Mina känslor är giltiga och förtjänar utrymme.",needs:["tankar","humör"],mode:"lugn",intensity:1,durationSec:10,audience:"neutral"}
  ],
  breathing_sessions: [
    {id:"b001",title:"4-6 Lugnt andetag",steps:["Sätt dig bekvämt och slut ögonen lätt.","Andas in i 4 sekunder – känn magen utvidgas.","Andas ut i 6 sekunder – låt axlarna sjunka.","Upprepa 6–8 gånger."],pattern:"4-6",needs:["stress"],mode:"lugn",intensity:1,durationSec:120,audience:"neutral"},
    {id:"b003",title:"Sömnandetag 4-7-8",steps:["Ligg ned eller luta dig bakåt.","Andas in i 4 sek – håll i 7 sek.","Andas ut i 8 sek. Upprepa 4 gånger.","Känn kroppen bli tyngre."],pattern:"4-7-8",needs:["sömn","stress"],mode:"sömn",intensity:1,durationSec:120,audience:"neutral"}
  ],
  micro_tools: [
    {id:"m001",title:"5-4-3-2-1 Grounding",steps:["Nämn 5 saker du kan SE runt dig.","Nämn 4 saker du kan KÄNNA.","Nämn 3 saker du kan HÖRA.","Nämn 2 dofter du gillar.","Nämn 1 smak du tycker om."],needs:["stress","tankar"],mode:"lugn",intensity:1,durationSec:90,audience:"neutral"},
    {id:"m007",title:"Rörelsebryt – Energikick",steps:["Res dig. Rulla axlarna bakåt 5 gånger.","10 armcirklar, sedan 10 knälyft.","Skaka händer och fötter i 15 sekunder.","Tre djupa andetag."],needs:["energi"],mode:"pepp",intensity:2,durationSec:90,audience:"neutral"},
    {id:"m019",title:"Digital paus",steps:["Lägg ned skärmen. Titta upp 15 sekunder.","Blinka naturligt 5 gånger.","Sträck på halsen åt alla håll.","Ta ett andetag."],needs:["energi","stress"],mode:"fokus",intensity:1,durationSec:60,audience:"neutral"}
  ],
  cbt_mini: [
    {id:"c001",title:"Utmana katastroftanken",prompt_fråga_1:"Vilken tanke känns störst just nu?",prompt_fråga_2:"Vad är det mest realistiska utfallet?",alternativ_tanke_prompt:"Skriv: 'Det är möjligt att... och jag kan hantera det genom...'",needs:["tankar","stress"],mode:"lugn",intensity:2,durationSec:120,audience:"neutral"}
  ]
};

const FALLBACK_CLOSING = {
  closing_double: [
    {id:"cd001",type:"compassion_step",lines:["Det är okej att ha en tuff dag – det är mänskligt och du är inte ensam.","Ta ett enda litet steg nu: ett glas vatten, ett andetag, eller bara sitta kvar."],needs:["humör"],mode:"lugn",intensity:1,durationSec:15,audience:"neutral"},
    {id:"cd025",type:"calm_gratitude",lines:["Ta ett djupt andetag och låt axlarna sjunka – du behöver inte hålla upp allt nu.","En sak du kan vara tacksam för just nu: att du tog dig tid att stanna upp."],needs:["stress"],mode:"lugn",intensity:1,durationSec:15,audience:"neutral"}
  ]
};

// ══════════════════════════════════════════
//  BIBLIOTEK – LADDA FRÅN JSON
// ══════════════════════════════════════════
let dailyLib     = null;
let dailyClosing = null;

// ══════════════════════════════════════════
//  PIN
// ══════════════════════════════════════════
let SAVED_PIN = localStorage.getItem('userPin') || null;
let pe = '';
let setupStep = 0;
let setupFirst = '';

function initLock() {
  if (!SAVED_PIN) {
    document.getElementById('lock-unlock').style.display = 'none';
    document.getElementById('lock-setup').style.display  = 'flex';
  } else {
    const bioOn = localStorage.getItem('bioOn') === '1';
    if (bioOn) { document.getElementById('faceid-btn').classList.remove('hidden'); setTimeout(tryBio, 400); }
  }
}

function ud() { for (let i=0;i<6;i++){const d=document.getElementById('d'+i);d.classList.remove('filled','error');if(i<pe.length)d.classList.add('filled');}}
function pp(digit) { if(pe.length>=6)return;pe+=digit;ud();document.getElementById('lock-err').innerText='';if(pe.length===6)setTimeout(chkPin,150);}
function pd() { pe=pe.slice(0,-1);ud();document.getElementById('lock-err').innerText='';}
function chkPin() {
  if (pe===SAVED_PIN){unlock();return;}
  for(let i=0;i<6;i++){document.getElementById('d'+i).classList.remove('filled');document.getElementById('d'+i).classList.add('error');}
  document.getElementById('lock-err').innerText='Fel PIN-kod, försök igen';
  setTimeout(()=>{for(let i=0;i<6;i++)document.getElementById('d'+i).classList.remove('error');pe='';ud();},800);
}
function unlock() { document.getElementById('lock').classList.add('hidden'); updateStreak(); loadFocus(); }

let se='';
function sudDots(){for(let i=0;i<6;i++){const d=document.getElementById('s'+i);d.classList.remove('filled','error');if(i<se.length)d.classList.add('filled');}}
function sp(digit){if(se.length>=6)return;se+=digit;sudDots();document.getElementById('setup-err').innerText='';if(se.length===6)setTimeout(checkSetup,150);}
function spd(){se=se.slice(0,-1);sudDots();}
function checkSetup(){
  if(setupStep===0){setupFirst=se;se='';sudDots();setupStep=1;document.getElementById('setup-sub').innerText='Ange samma PIN igen för att bekräfta.';document.getElementById('setup-err').innerText='';}
  else{
    if(se===setupFirst){SAVED_PIN=se;localStorage.setItem('userPin',SAVED_PIN);document.getElementById('lock-setup').style.display='none';document.getElementById('lock-unlock').style.display='flex';unlock();}
    else{
      for(let i=0;i<6;i++)document.getElementById('s'+i).classList.add('error');
      document.getElementById('setup-err').innerText='PIN-koderna stämmer inte. Försök igen.';
      setTimeout(()=>{for(let i=0;i<6;i++)document.getElementById('s'+i).classList.remove('error');setupStep=0;setupFirst='';se='';sudDots();document.getElementById('setup-sub').innerText='Välj en PIN-kod (6 siffror).';},900);
    }
  }
}

// ══════════════════════════════════════════
//  BIOMETRICS
// ══════════════════════════════════════════
async function tryBio(){
  if(!window.PublicKeyCredential){document.getElementById('lock-err').innerText='Biometri ej tillgänglig';return;}
  const cid=localStorage.getItem('bioCred');if(!cid){document.getElementById('lock-err').innerText='Aktivera Face ID i Inställningar';return;}
  try{const ch=new Uint8Array(32);crypto.getRandomValues(ch);const a=await navigator.credentials.get({publicKey:{challenge:ch,allowCredentials:[{id:b64toBuf(cid),type:'public-key',transports:['internal']}],userVerification:'required',timeout:60000}});if(a)unlock();}
  catch(e){document.getElementById('lock-err').innerText='Biometri misslyckades, ange PIN';}
}
async function regBio(){
  if(!window.PublicKeyCredential){alert('Face ID stöds ej');document.getElementById('bioToggle').checked=false;return;}
  try{const ch=new Uint8Array(32);crypto.getRandomValues(ch);const uid=new Uint8Array(16);crypto.getRandomValues(uid);const c=await navigator.credentials.create({publicKey:{challenge:ch,rp:{name:'Hälsa XYZ'},user:{id:uid,name:'user',displayName:'Användare'},pubKeyCredParams:[{type:'public-key',alg:-7}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required'},timeout:60000}});localStorage.setItem('bioCred',bufToB64(c.rawId));localStorage.setItem('bioOn','1');document.getElementById('faceid-btn').classList.remove('hidden');alert('Face ID aktiverat! ✅');}
  catch(e){alert('Kunde inte aktivera: '+e.message);document.getElementById('bioToggle').checked=false;}
}
function onBioToggle(on){if(on){regBio();}else{localStorage.setItem('bioOn','0');localStorage.removeItem('bioCred');document.getElementById('faceid-btn').classList.add('hidden');}}
function onFreeTextToggle(on){localStorage.setItem('saveFreeTextLogs',on?'1':'0');}
function bufToB64(b){return btoa(String.fromCharCode(...new Uint8Array(b)));}
function b64toBuf(s){const bin=atob(s);const buf=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)buf[i]=bin.charCodeAt(i);return buf.buffer;}

// ══════════════════════════════════════════
//  RESIZE
// ══════════════════════════════════════════
function resizeApp(){document.getElementById('shell').style.height=window.innerHeight+'px';}
resizeApp();window.addEventListener('resize',resizeApp);window.addEventListener('orientationchange',()=>setTimeout(resizeApp,300));

// ══════════════════════════════════════════
//  DATA
// ══════════════════════════════════════════
const defGrat=["Tacksam för att jag har bra vänner","Jag har hälsa och kraft i kroppen","Tacksam för att solen går upp varje morgon","Jag har mat på bordet varje dag","Tacksam för att jag har ett tak över huvudet","Jag har människor som bryr sig om mig","Tacksam för att jag fick uppleva en ny dag","Jag har förmågan att lära mig nya saker","Tacksam för naturen och frisk luft runt mig","Jag har ett hjärta som slår och lungor som andas","Tacksam för skrattet som lyser upp dagen","Jag har minnen som värmer mitt hjärta","Tacksam för att jag kan röra mig fritt","Jag har drömmar och mål att sträva mot","Tacksam för musikens förmåga att lyfta mitt humör","Jag har styrka att hantera utmaningar","Tacksam för en varm kopp kaffe på morgonen","Jag har möjlighet att välja hur jag tänker","Tacksam för att varje dag ger nya möjligheter","Jag har förmågan att känna kärlek och glädje","Tacksam för att jag bor i ett tryggt land","Jag har tillgång till rent vatten varje dag","Tacksam för att jag kan ge och ta emot en kram","Jag har kreativitet och fantasi","Tacksam för ögonblick av stillhet och ro","Jag har lärt mig av mina misstag och blivit starkare","Tacksam för att jag har en fungerande kropp","Jag har tillgång till utbildning och kunskap","Tacksam för solnedgångarnas skönhet","Jag har möjlighet att hjälpa andra","Tacksam för att jag kan kommunicera och uttrycka mig","Jag har hopp om en bättre morgondag","Tacksam för böcker och berättelser som inspirerar","Jag har förmågan att förlåta och gå vidare","Tacksam för att jag har ett arbete att gå till","Jag har passion för saker som engagerar mig","Tacksam för varje litet steg framåt","Jag har förmåga att känna tacksamhet i sig självt","Tacksam för regnet som ger liv åt naturen","Jag har erfarenheter som format mig positivt","Tacksam för att jag kan se stjärnorna på natten","Jag har mod att möta det okända","Tacksam för djurens sällskap och glädje","Jag har en hjärna som kan lösa problem","Tacksam för att familjen finns i mitt liv","Jag har möjlighet att träna och hålla mig frisk","Tacksam för tekniken som förenklar min vardag","Jag har frihet att göra egna val","Tacksam för att jag kan se skönhet i vardagen","Jag har tid att vila och återhämta mig","Tacksam för alla goda samtal jag har haft","Jag har förmågan att anpassa mig och växa","Tacksam för varje gång någon sagt något snällt till mig","Jag har resurser och verktyg för att nå mina mål","Tacksam för havet, skogen och bergen","Jag har en röst och mod att använda den","Tacksam för att jag kan känna empati för andra","Jag har en historia att vara stolt över","Tacksam för de utmaningar som gjort mig starkare","Jag har möjlighet att skapa något meningsfullt","Tacksam för att jag kan njuta av god mat","Jag har vänner som lyssnar när jag behöver det","Tacksam för de skratt jag delar med nära och kära","Jag har förmågan att börja om varje dag","Tacksam för att livet ger mig nya chanser","Jag har nyfikenhet som driver mig framåt","Tacksam för de tysta stunderna som laddar batterierna","Jag har ett leende att ge bort gratis","Tacksam för att jag kan drömma om framtiden","Jag har tacksamheten som gör livet rikare","Tacksam för varje andetag jag tar","Jag har förmågan att se ljuset även i mörkret","Tacksam för alla möjligheter som ännu inte kommit","Jag har kärlek att ge och ta emot","Tacksam för att jag klarade igår och klarar idag","Jag har tro på att allt ordnar sig","Tacksam för att jag är unik och värdefull precis som jag är","Jag har livet framför mig fullt av möjligheter"];
const defQuotes=["Du är starkare än du tror","Varje dag tar jag steg mot mitt bästa jag","Jag är kapabel att klara vad som än kommer","Mina känslor är ok, även de trötta och irriterande","Jag väljer att tro på mig själv idag","Varje utmaning gör mig starkare","Jag förtjänar att må bra","Jag har klarat svåra saker förut och klarar det igen","Min energi återvänder när jag tar hand om mig","Jag är nog precis som jag är just nu","Det är ok att ha en dålig dag, imorgon är ny","Jag växer varje gång jag väljer att fortsätta","Jag har allt inom mig som jag behöver","Mina drömmar är värda att kämpa för","Jag tillåter mig själv att vila utan skuldkänslor","Varje litet framsteg räknas och betyder något","Jag är värd kärlek och respekt","Jag väljer att fokusera på det jag kan påverka","Min kropp gör sitt bästa för mig varje dag","Jag är modig nog att ta nästa steg","Det bästa i mig visar sig när det är som svårast","Jag är stolt över hur långt jag kommit","Jag väljer att se möjligheter istället för hinder","Jag är en person som gör skillnad","Min potential är obegränsad","Jag tillåter mig att vara mänsklig och ofullständig","Jag har mod även när jag är rädd","Varje morgon är en ny chans att börja om","Jag litar på min förmåga att fatta bra beslut","Jag är värd det bästa som livet har att erbjuda","Mitt sinne är lugnt och mitt hjärta är starkt","Jag väljer glädje, även när det kostar lite ansträngning","Jag är kapabel att lära mig och växa","Jag ger mig själv tillåtelse att misslyckas och försöka igen","Jag är en magnet för positiva möjligheter","Det finns kraft i mig som jag ännu inte fullt använt","Jag är viktig och min röst har värde","Jag kan hantera osäkerhet med lugn och tålamod","Varje dag bygger jag ett liv jag är stolt över","Jag väljer att inte ge upp, inte idag","Jag har förmågan att skapa förändring i mitt liv","Mina tankar formar min verklighet och jag väljer positiva tankar","Jag är mer än mina misstag","Jag tillåter mig att ta plats och synas","Jag har resurser och kreativitet att lösa problem","Det är ok att be om hjälp, det är ett styrketecken","Jag väljer att behandla mig själv med vänlighet","Jag tror på den process jag är mitt i","Varje andetag påminner mig om att jag lever och har kraft","Jag är på rätt väg, även om den känns lång","Jag förtjänar framgång och lycka","Min inre styrka är starkare än alla yttre omständigheter","Jag är nyfiken och öppen för nya möjligheter","Jag väljer att lita på livet och dess riktning","Mina svaga stunder är en del av min styrka","Jag är tillräckligt bra precis som jag är idag","Jag har klarat 100% av mina svåraste dagar hittills","Jag väljer att leva i nuet och inte oroa mig i onödan","Jag är kapabel att skapa den förändring jag önskar","Varje utmaning är en möjlighet att lära sig något nytt","Jag väljer att fira mina framsteg, stora som små","Jag är omgiven av möjligheter om jag väljer att se dem","Min vilja och mitt mod är starkare än min rädsla","Jag ger inte upp för att det är svårt, jag ger mig för att det är värt det","Jag förtjänar lugn, glädje och inre frid","Jag är i ständig utveckling och det är något att vara stolt över","Varje dag gör jag mitt bästa och det är tillräckligt","Jag väljer att tro att allt är möjligt","Mina erfarenheter har format mig till den starka person jag är","Jag är fri att skapa det liv jag vill leva","Jag lyssnar på min kropp och ger den vad den behöver","Jag är kapabel att förändra det som inte tjänar mig längre","Mitt mod växer varje gång jag möter mina rädslor","Jag väljer att omge mig med energi som lyfter mig","Jag är värd att investera tid och kärlek på mig själv","Jag tror på min förmåga att nå mina mål","Jag är ett verk i framsteg och det är fantastiskt","Idag väljer jag att vara snäll mot mig själv"];

function loadL(k, fb){const value=loadJSON(k, null);return value?value:[...fb];}
function saveL(k,a){saveJSON(k,a);}
let myGrat=loadL('gratList',defGrat);
let myQuotes=loadL('quoteList',defQuotes);
state.myGrat=myGrat;
state.myQuotes=myQuotes;

// ══════════════════════════════════════════
//  THEME
// ══════════════════════════════════════════
let currentTheme=getItem('theme','auto');
state.currentTheme=currentTheme;
function isNight(){const h=new Date().getHours();return h>=19||h<7;}
function applyTheme(){document.body.classList.toggle('dark',currentTheme==='dark'||(currentTheme==='auto'&&isNight()));}
function setTheme(t){currentTheme=t;state.currentTheme=t;setItem('theme',t);applyTheme();document.querySelectorAll('.theme-opt').forEach(b=>b.classList.remove('active'));document.getElementById('th-'+t).classList.add('active');}
setInterval(()=>{if(currentTheme==='auto')applyTheme();},60000);

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
(async function init(){
  applyTheme();
  const t=getItem('theme','auto');
  document.querySelectorAll('.theme-opt').forEach(b=>b.classList.remove('active'));
  document.getElementById('th-'+t).classList.add('active');
  document.getElementById('bioToggle').checked=localStorage.getItem('bioOn')==='1';
  document.getElementById('freeTextToggle').checked=localStorage.getItem('saveFreeTextLogs')==='1';
  loadStats();updateScreenInfo();initLock();
  initToolsModule();initPerspectiveModule();initStatsModule();initSettingsModule();
  checkinFlowApi = initCheckinFlow({});
  await loadLibraries();
  renderGratitude();newQuote();renderHelp();
  // om check-infliken är aktiv redan – rendera
  if(document.getElementById('tab-checkin').classList.contains('active')) checkinFlowApi?.render?.();
})();

// ══════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════
const router = initRouter({
  onTabChange(name){
    if(name!=='tools')stopBreath();
    if(name==='settings'){renderLists();updateScreenInfo();}
    if(name==='stats'){loadStats();loadFocus();}
    if(name==='tools')renderHelp();
    if(name==='perspective'){
      renderGratitude();
      newQuote();
    }
    if(name==='checkin')checkinFlowApi?.render?.();
  }
});
initGuideOverlay({ router });

function showTab(name){
  router.goToTab(name);
}
function primaryNeedFromCheckin(){
  const pre=flowState.pre||flowState.preLocked||{stress:5,humör:5,energi:5,sömn:5};
  if((pre.stress||0)>=8) return 'tankar';
  const scores=[
    {need:'stress',score:pre.stress||0},
    {need:'humör',score:10-(pre.humör||0)},
    {need:'energi',score:10-(pre.energi||0)},
    {need:'sömn',score:10-(pre.sömn||0)}
  ].sort((a,b)=>b.score-a.score);
  return scores[0]?.need||'stress';
}
function openGuideFromCheckin(){
  openGuide({ need: primaryNeedFromCheckin(), title: 'Snabb hjälp' });
}
function openGuideTrigger(topic){
  if(topic==='perspective_why') return openGuide({ topic, title:'Varför perspektiv?' });
  if(topic==='tools_intro') return openGuide({ topic, need:'stress', title:'Välj verktyg' });
  return openGuide({ topic, title:'Guide' });
}
function updateScreenInfo(){const w=window.innerWidth,h=window.innerHeight;const d=w>=1024?'🖥️ Dator':w>=768?'📱 iPad':'📱 Mobil';const el=document.getElementById('screen-info');if(el)el.innerText=d+' · '+w+'×'+h+'px';}
window.addEventListener('resize',updateScreenInfo);

// ══════════════════════════════════════════
//  TACKSAMHET
// ══════════════════════════════════════════
const natIDs=[10,11,12,13,14,16,17,18,19,20,21,22,23,24,25,26,27,29,30,31];
function renderGratitude(){
  const c=document.getElementById('grat-cont');c.innerHTML='';
  const ids=[...natIDs].sort(()=>0.5-Math.random());
  const txts=[...myGrat].sort(()=>0.5-Math.random()).slice(0,3);
  const colors=['#111111','#1a3a6b','#1a5c2a'];
  const emojis=['🌿','💙','🌱'];
  const iw=document.createElement('div');iw.style.cssText='margin-bottom:12px;border-radius:16px;overflow:hidden;';
  const img=document.createElement('img');img.src='https://picsum.photos/id/'+ids[0]+'/900/400';img.className='grat-img';img.onerror=function(){this.style.display='none';};
  iw.appendChild(img);c.appendChild(iw);
  const tc=document.createElement('div');tc.className='card';tc.style.textAlign='left';
  txts.forEach((t,i)=>{const p=document.createElement('p');p.className='grat-line';p.style.color=colors[i];const span=document.createElement('span');span.innerText=emojis[i]+' ';p.appendChild(span);p.appendChild(document.createTextNode(t));tc.appendChild(p);});
  c.appendChild(tc);incStat('grat');
}

// ══════════════════════════════════════════
//  LUGN / ANDNING
// ══════════════════════════════════════════
let timerInt,breathInt;
function startCustom(){const mins=parseInt(document.getElementById('custom-min').value)||5;startBreath(mins*60);}
function startBreath(secs){stopBreath();document.getElementById('bwrap').classList.add('show');let left=secs;updateTimerDisp(left);runCycle();breathInt=setInterval(runCycle,12000);timerInt=setInterval(()=>{left--;updateTimerDisp(left);incStat('breath_sec');if(left<=0){stopBreath();alert('Bra jobbat! 🌿');}},1000);}
function runCycle(){animB('in');setTimeout(()=>animB('hold'),4000);setTimeout(()=>animB('out'),8000);}
function animB(phase){const ring=document.getElementById('bring'),lbl=document.getElementById('breath-lbl'),txt=document.getElementById('btxt');ring.style.animation='none';void ring.offsetWidth;if(phase==='in'){lbl.innerText='🌬️ Andas in...';lbl.style.color='#a5f3fc';txt.innerText='In\n4s';ring.style.animation='bIn 4s ease-in-out forwards';}else if(phase==='hold'){lbl.innerText='⏸️ Håll andan...';lbl.style.color='#fde68a';txt.innerText='Håll\n4s';ring.style.animation='bHold 4s ease-in-out forwards';}else{lbl.innerText='💨 Andas ut...';lbl.style.color='#bbf7d0';txt.innerText='Ut\n4s';ring.style.animation='bOut 4s ease-in-out forwards';}}
function stopBreath(){clearInterval(timerInt);clearInterval(breathInt);document.getElementById('timer-disp').innerText='00:00';document.getElementById('breath-lbl').innerText='Välj tid och starta';document.getElementById('btxt').innerText='';document.getElementById('bwrap').classList.remove('show');document.getElementById('bring').style.animation='none';stopAllSounds();}
function updateTimerDisp(s){const m=Math.floor(s/60),sec=s%60;document.getElementById('timer-disp').innerText=String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');}

// ══════════════════════════════════════════
//  LJUD
// ══════════════════════════════════════════
let AC=null,sounds={};
function getAC(){if(!AC){const A=window.AudioContext||window.webkitAudioContext;if(A)AC=new A();}if(AC&&AC.state==='suspended')AC.resume();return AC;}
function makeRain(){const ac=getAC();if(!ac)return null;const gain=ac.createGain();gain.gain.value=0;gain.connect(ac.destination);function addLayer(freq,q,vol){const buf=ac.createBuffer(1,ac.sampleRate*3,ac.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const src=ac.createBufferSource();src.buffer=buf;src.loop=true;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=q;const g=ac.createGain();g.gain.value=vol;src.connect(f);f.connect(g);g.connect(gain);src.start();}addLayer(600,.8,.6);addLayer(1200,1.2,.4);addLayer(3000,2,.2);return{gain,type:'rain'};}
function makeOcean(){const ac=getAC();if(!ac)return null;const gain=ac.createGain();gain.gain.value=0;gain.connect(ac.destination);const buf=ac.createBuffer(1,ac.sampleRate*4,ac.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const src=ac.createBufferSource();src.buffer=buf;src.loop=true;const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=400;const lfo=ac.createOscillator();lfo.frequency.value=0.1;const lfoG=ac.createGain();lfoG.gain.value=200;lfo.connect(lfoG);lfoG.connect(f.frequency);lfo.start();src.connect(f);f.connect(gain);src.start();return{gain,type:'ocean'};}
function makeForest(){const ac=getAC();if(!ac)return null;const gain=ac.createGain();gain.gain.value=0;gain.connect(ac.destination);const buf=ac.createBuffer(1,ac.sampleRate*4,ac.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const src=ac.createBufferSource();src.buffer=buf;src.loop=true;const wind=ac.createBiquadFilter();wind.type='bandpass';wind.frequency.value=300;wind.Q.value=0.5;const windG=ac.createGain();windG.gain.value=0.4;const buf2=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const d2=buf2.getChannelData(0);for(let i=0;i<d2.length;i++)d2[i]=Math.random()*2-1;const src2=ac.createBufferSource();src2.buffer=buf2;src2.loop=true;const leaves=ac.createBiquadFilter();leaves.type='highpass';leaves.frequency.value=2000;const leavesG=ac.createGain();leavesG.gain.value=0.15;const lfo=ac.createOscillator();lfo.frequency.value=0.05;const lfoG=ac.createGain();lfoG.gain.value=0.2;lfo.connect(lfoG);lfoG.connect(windG.gain);lfo.start();src.connect(wind);wind.connect(windG);windG.connect(gain);src2.connect(leaves);leaves.connect(leavesG);leavesG.connect(gain);src.start();src2.start();return{gain,type:'forest'};}
function makeBrown(){const ac=getAC();if(!ac)return null;const gain=ac.createGain();gain.gain.value=0;gain.connect(ac.destination);const buf=ac.createBuffer(1,ac.sampleRate*4,ac.sampleRate);const d=buf.getChannelData(0);let last=0;for(let i=0;i<d.length;i++){const w=Math.random()*2-1;last=(last+0.02*w)/1.02;d[i]=last*3.5;}const src=ac.createBufferSource();src.buffer=buf;src.loop=true;const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=200;const boost=ac.createGain();boost.gain.value=6;src.connect(f);f.connect(boost);boost.connect(gain);src.start();return{gain,type:'brown'};}
function toggleSound(type){const btn=document.getElementById(type+'-btn');if(!sounds[type]){if(type==='rain')sounds[type]=makeRain();else if(type==='ocean')sounds[type]=makeOcean();else if(type==='forest')sounds[type]=makeForest();else if(type==='brown')sounds[type]=makeBrown();}if(!sounds[type])return;const g=sounds[type].gain;const labels={rain:'PÅ 🌧️',ocean:'PÅ 🌊',forest:'PÅ 🌲',brown:'PÅ 🟤'};if(g.gain.value===0){const vol=parseFloat(document.getElementById(type+'-vol').value);g.gain.setTargetAtTime(vol,getAC().currentTime,0.3);btn.innerText=labels[type];btn.classList.add('on');}else{g.gain.setTargetAtTime(0,getAC().currentTime,0.3);btn.innerText='AV';btn.classList.remove('on');}}
function setVol(type,v){if(sounds[type]&&sounds[type].gain.gain.value>0)sounds[type].gain.gain.setTargetAtTime(parseFloat(v),getAC()?.currentTime||0,0.1);}
function stopAllSounds(){['rain','ocean','forest','brown'].forEach(t=>{if(sounds[t])sounds[t].gain.gain.setTargetAtTime(0,getAC()?.currentTime||0,0.3);const btn=document.getElementById(t+'-btn');if(btn){btn.innerText='AV';btn.classList.remove('on');}});}

// ══════════════════════════════════════════
//  PEPP
// ══════════════════════════════════════════
const pEmojis=['💚','⭐','🌱','✨','💪','🌟','🔥','🌈','💎','🦋','🌺','☀️'];
function newQuote(){document.getElementById('quote-txt').innerText=myQuotes[Math.floor(Math.random()*myQuotes.length)];document.getElementById('pepp-emoji').innerText=pEmojis[Math.floor(Math.random()*pEmojis.length)];incStat('pepp');}

// ══════════════════════════════════════════
//  ÄNDRA PIN
// ══════════════════════════════════════════
function changePin(){localStorage.removeItem('userPin');SAVED_PIN=null;setupStep=0;setupFirst='';se='';for(let i=0;i<6;i++){document.getElementById('s'+i).classList.remove('filled','error');}document.getElementById('setup-sub').innerText='Välj en ny PIN-kod (6 siffror).';document.getElementById('setup-err').innerText='';document.getElementById('lock-unlock').style.display='none';document.getElementById('lock-setup').style.display='flex';document.getElementById('lock').classList.remove('hidden');}

// ══════════════════════════════════════════
//  FOKUS / AVSIKT
// ══════════════════════════════════════════
function loadFocus(){try{const f=JSON.parse(localStorage.getItem('dailyFocus')||'{}');const today=new Date().toDateString();const disp=document.getElementById('focus-display'),inp=document.getElementById('focus-input'),dateEl=document.getElementById('focus-date');if(!disp)return;if(f.date===today&&f.text){disp.innerText='"'+f.text+'"';disp.style.display='block';if(inp)inp.value=f.text;if(dateEl)dateEl.innerText='Sparad idag';}else{disp.style.display='none';if(dateEl)dateEl.innerText='';}}catch(e){}}
function saveFocus(){const inp=document.getElementById('focus-input');if(!inp)return;const v=inp.value.trim();if(!v)return;const today=new Date().toDateString();localStorage.setItem('dailyFocus',JSON.stringify({text:v,date:today}));const disp=document.getElementById('focus-display');if(disp){disp.innerText='"'+v+'"';disp.style.display='block';}const dateEl=document.getElementById('focus-date');if(dateEl)dateEl.innerText='Sparad idag ✓';}

// ══════════════════════════════════════════
//  STATISTIK
// ══════════════════════════════════════════
function loadStats(){
  const s=JSON.parse(localStorage.getItem('stats')||'{}');
  document.getElementById('st-breath').innerText=Math.floor((s.breath_sec||0)/60)+' min';
  document.getElementById('st-grat').innerText=s.grat||0;
  document.getElementById('st-pepp').innerText=s.pepp||0;
  const streak=s.streak||0;
  document.getElementById('st-streak').innerText=streak;

  const logs=loadFlowLogs().filter(l=>l&&l.counted===true);
  document.getElementById('st-flow').innerText=logs.length;

  const latest7=logs.slice(-7);
  if(latest7.length){
    const avg=(arr,key,post=false)=>arr.reduce((a,l)=>a+Number(post?l?.after?.[key]??l?.post?.[key]:l?.pre?.[key]??(key==='tankar'?null:0)??0),0)/arr.length;
    const sp=avg(latest7,'stress');
    const hp=avg(latest7,'humör');
    const tp=avg(latest7,'tankar');
    const sAfter=latest7.reduce((a,l)=>a+Number(l?.after?.afterSliderNeedVal??l?.post?.stress??l?.after?.stress??sp),0)/latest7.length;
    const hAfter=latest7.reduce((a,l)=>a+Number(l?.post?.humör??hp),0)/latest7.length;
    const tAfter=latest7.reduce((a,l)=>a+Number((l?.focusNeed==='tankar'?l?.after?.afterSliderNeedVal:null)??l?.after?.tankar??tp),0)/latest7.length;
    document.getElementById('st-lift').innerText=`S ${sp.toFixed(1)}→${sAfter.toFixed(1)} · H ${hp.toFixed(1)}→${hAfter.toFixed(1)} · T ${tp.toFixed(1)}→${tAfter.toFixed(1)}`;
  } else document.getElementById('st-lift').innerText='–';

  const deltas=latest7.map(l=>{
    if(Number(l.flowMinutes||l.sessionLengthMin)===8&&Number.isFinite(l?.after?.intensityBefore)&&Number.isFinite(l?.after?.intensityAfter)){
      return `8m ${l.after.intensityBefore}→${l.after.intensityAfter}`;
    }
    if(Number(l.flowMinutes||l.sessionLengthMin)===3&&l.focusNeed){
      return `3m ${l.focusNeed} · ★${Number(l.stars||0)}`;
    }
    if(l.focusNeed&&Number.isFinite(l?.pre?.[l.focusNeed])&&Number.isFinite(l?.after?.afterSliderNeedVal)){
      return `3m ${l.focusNeed}: ${l.pre[l.focusNeed]}→${l.after.afterSliderNeedVal}`;
    }
    return null;
  }).filter(Boolean);
  const deltaEl=document.getElementById('st-delta');
  if(deltaEl) deltaEl.innerText=deltas.length?deltas.slice(-3).join(' · '):'–';

  const dist={3:0,8:0,10:0}; logs.forEach(l=>{const k=Number(l.flowMinutes||l.sessionLengthMin);if(dist[k]!==undefined)dist[k]++;});
  document.getElementById('streak-badge').innerText=`🔥 ${streak} dagars streak · 3m:${dist[3]} 8m:${dist[8]} 10m:${dist[10]}`;
}
function incStat(key){const s=JSON.parse(localStorage.getItem('stats')||'{}');s[key]=(s[key]||0)+1;localStorage.setItem('stats',JSON.stringify(s));loadStats();}
function resetStats(){if(confirm('Nollställa all statistik?')){localStorage.removeItem('stats');loadStats();}}
function updateStreak(){const s=JSON.parse(localStorage.getItem('stats')||'{}');const today=new Date().toDateString();if(s.lastDay===today)return;const yesterday=new Date(Date.now()-86400000).toDateString();s.streak=s.lastDay===yesterday?(s.streak||0)+1:1;s.lastDay=today;localStorage.setItem('stats',JSON.stringify(s));loadStats();}

// ══════════════════════════════════════════
//  FLOW LOGS
// ══════════════════════════════════════════
function loadFlowLogs(){try{return JSON.parse(localStorage.getItem('dailyFlowLogs')||'[]');}catch(e){return[];}}
function saveFlowLogs(logs){try{localStorage.setItem('dailyFlowLogs',JSON.stringify(logs));}catch(e){}}
function ymd(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function getTodayCountedLog(){const today=ymd();return loadFlowLogs().find(l=>l.date===today&&l.counted===true)||null;}
function getRecentIds(key){const cutoff=Date.now()-7*24*3600*1000;const ids=[];loadFlowLogs().forEach(l=>{if(new Date(l.completedAt||0).getTime()>=cutoff){if(l.blocks){l.blocks.forEach(b=>{if(b&&b.kind===key&&b.id)ids.push(b.id);});}if((key==='affirmation'||key==='gratitude')&&l.closing?.id&&l.closing?.type==='single')ids.push(l.closing.id);if(key==='closing_double'&&l.closing?.id&&l.closing?.type==='double')ids.push(l.closing.id);}});getRecentIdsFromRotation(`recent_${key}`).forEach(id=>ids.push(id));return new Set(ids);}

// ══════════════════════════════════════════
//  REGELMOTOR + THEME
// ══════════════════════════════════════════
function determineMode(pre){
  const hour=new Date().getHours();
  const {stress=5,humör=5,energi=5,sömn=7}=pre||{};
  if(stress>=8)return 'lugn';
  if(sömn<=3 && (hour>=19||hour<=7))return 'sömn';
  if(humör<=3)return 'pepp';
  if(energi<=3)return 'fokus';
  if(stress>=4&&stress<=7)return 'lugn';
  return (humör>=4&&humör<=6)?'pepp':'fokus';
}
function guessTheme(hour, dayOfWeek){
  if(dayOfWeek===0||dayOfWeek===6) return hour<12?'recovery':'gratitude';
  if(hour<6) return 'sleep';
  if(hour<12) return 'focus';
  if(hour<18) return 'energy';
  if(hour<22) return 'calm';
  return 'sleep';
}

function validLibrary(data){return data&&Array.isArray(data.gratitude)&&Array.isArray(data.affirmations)&&Array.isArray(data.breathing_sessions)&&Array.isArray(data.micro_tools);}
function validClosing(data){return data&&Array.isArray(data.closing_double);}

async function fetchAndCache(url, cacheKey, fallback, validator){
  try{
    const response=await fetch(url);
    if(response.ok){
      const data=await response.json();
      if(validator(data)){try{localStorage.setItem(cacheKey,JSON.stringify(data));}catch(e){};return data;}
    }
  }catch(e){}
  try{const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');if(cached&&validator(cached))return cached;}catch(e){}
  return fallback;
}

async function loadLibraries(){
  const loaded=await loadDataLibraries({ fallbackLib: FALLBACK_LIB, fallbackClosing: FALLBACK_CLOSING });
  dailyLib=loaded.library;
  dailyClosing=loaded.closing;
  state.dailyLib=dailyLib;
  state.dailyClosing=dailyClosing;
}

let flowState={step:1,sessionLengthMin:3,counted:true,pre:null,preLocked:null,mode:null,themeGuess:null,blocks:[],closing:null,post:{},cbt:{},completed:false};
state.flowState=flowState;

function hasThemeMatch(item,theme){
  return engineThemeMatch(item,theme);
}
function pickByModeWithHistory(list,mode,kind,theme){
  const recent=[...getRecentIds(kind)];
  const picked=enginePickByMode(list?.filter(x=>!theme||hasThemeMatch(x,theme)),mode,recent);
  if(picked) return picked;
  return enginePickByMode(list,mode,recent);
}
function pickClosing(pre,mode,theme){
  const doubles=(dailyClosing&&dailyClosing.closing_double)||[];
  const doubleRecent=getRecentIds('closing_double');
  const pickDouble=(type)=>{
    const byType=doubles.filter(c=>c.type===type);
    let pool=byType.filter(c=>!doubleRecent.has(c.id));
    if(pool.length===0) pool=byType;
    return pool[0]||null;
  };
  if(pre.humör<=3){const picked=pickDouble('compassion_step');if(picked)return {type:'double',source:picked};}
  if(pre.stress>=8&&pre.humör>3){const picked=pickDouble('calm_gratitude');if(picked)return {type:'double',source:picked};}
  const affirm=pickByModeWithHistory((dailyLib&&dailyLib.affirmations)||[],mode,'affirmation',theme);
  const grat=pickByModeWithHistory((dailyLib&&dailyLib.gratitude)||[],mode,'gratitude',theme);
  const one=Math.random()<0.5?affirm:grat;
  return one?{type:'single',source:one}:{type:'single',source:{id:'fb-close',text:'Du gjorde något viktigt för dig själv idag.'}};
}
function flowLengthConfig(min){
  if(min===10)return {checkin:60,main:180,closing:20};
  if(min===6)return {checkin:45,main:240,closing:20};
  return {checkin:30,main:110,closing:20};
}

function renderFlow(){
  const root=document.getElementById('flow-root'); if(!root) return;
  if(!dailyLib||!dailyClosing){root.innerHTML='<div class="flow-loading"><span class="spinner">⏳</span>Laddar dagens innehåll…</div>';return;}
  renderFlowStep(root);
}
function startFlow(len,counted){
  flowState={step:2,sessionLengthMin:len,counted:!!counted,pre:null,preLocked:null,mode:null,themeGuess:null,blocks:[],closing:null,post:{},cbt:{},completed:false};
  renderFlow();
}
function startFlowAgain(){startFlow(flowState.sessionLengthMin,false);}

function renderFlowStep(root){
  const todayDone=getTodayCountedLog();
  const cfg=flowLengthConfig(flowState.sessionLengthMin||3);
  if(flowState.step===1||!flowState.step){
    root.innerHTML=`<div class="card"><div style="margin-bottom:10px;font-weight:700;">Dagens check</div>
      ${todayDone?`<div class="flow-done-banner"><span class="flow-done-icon">✅</span><div class="flow-done-title">Redan gjort idag</div><div class="flow-done-sub">Du har redan en räknad check idag.</div><button class="flow-btn" onclick="startFlow(3,false)">Kör igen (räknas inte)</button></div>`:''}
      <div style="display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:12px;">
        <button class="flow-btn" onclick="startFlow(3,${todayDone?'false':'true'})">1) 3 min (snabbt)</button>
        <button class="flow-btn" onclick="startFlow(6,${todayDone?'false':'true'})">2) 6 min (balans)</button>
        <button class="flow-btn" onclick="startFlow(10,${todayDone?'false':'true'})">3) 10 min (djup)</button>
      </div>
      <div class="flow-note">Check-in ~${cfg.checkin}s, väljer innehåll automatiskt och sparas lokalt.</div></div>`;
    return;
  }
  if(flowState.step===2){root.innerHTML=renderCheckin();return;}
  if(flowState.step===3){root.innerHTML=renderMainStep();return;}
  if(flowState.step===4){root.innerHTML=renderClosing();return;}
}

function renderCheckin(){
  const pre=flowState.pre||{stress:5,humör:5,energi:5,sömn:5};
  const row=(k,l,e)=>`<div><div class="ci-label">${l}</div><div class="ci-row"><input ${flowState.preLocked?'disabled':''} type="range" min="0" max="10" value="${pre[k]}" class="ci-slider" oninput="updatePre('${k}',this.value)"><span class="ci-emoji">${e}</span><span class="ci-val">${pre[k]}</span></div></div>`;
  return `<div class="card"><strong>Steg 1/${flowState.sessionLengthMin===3?3:4}: Check-in</strong><div class="flow-note">Samma check-in för 3/6/10 min.</div><button class="link-btn" onclick="openGuideFromCheckin()">Lär mer</button><div style="margin-top:12px;">${row('stress','Stress','😵')}${row('humör','Humör','🙂')}${row('energi','Energi','⚡')}${row('sömn','Sömnkvalitet','🌙')}</div>
  <button class="flow-btn" onclick="lockAndStartFlow()">Starta (${flowState.sessionLengthMin} min)</button><button class="flow-btn-ghost" onclick="flowState.step=1;renderFlow()">← Tillbaka</button></div>`;
}
function updatePre(k,v){flowState.pre=flowState.pre||{stress:5,humör:5,energi:5,sömn:5};flowState.pre[k]=parseInt(v,10)||0;renderFlow();}
function lockAndStartFlow(){
  const pre=flowState.pre||{stress:5,humör:5,energi:5,sömn:5};
  const now=new Date();
  flowState.preLocked={...pre};
  flowState.mode=determineMode(pre);
  flowState.themeGuess=guessTheme(now.getHours(),now.getDay());
  flowState.closing=pickClosing(pre,flowState.mode,flowState.themeGuess);
  buildBlocks();
  flowState.step=3;
  renderFlow();
}
function buildBlocks(){
  const mode=flowState.mode, len=flowState.sessionLengthMin;
  const blocks=[];
  const breath=pickByModeWithHistory((dailyLib&&dailyLib.breathing_sessions)||[],mode,'breathing',null);
  const micro=pickByModeWithHistory((dailyLib&&dailyLib.micro_tools)||[],mode,'micro',null);
  const builtBreath46={id:'built-46',title:'Inbyggd andning 4-6',steps:['Andas in 4 sek','Andas ut 6 sek','Upprepa lugnt i 2 minuter']};
  const builtBreath446={id:'built-446',title:'Inbyggd andning 4-4-6',steps:['Andas in 4 sek','Håll 4 sek','Andas ut 6 sek','Upprepa i 2 minuter']};
  if(len===3){
    blocks.push((mode==='lugn'||mode==='sömn')?{kind:'breathing',item:breath}:{kind:'micro',item:micro});
  }
  if(len===6){
    blocks.push({kind:'breathing',item:breath||(Math.random()<0.5?builtBreath46:builtBreath446)});
    blocks.push({kind:'cbt-mini'});
  }
  if(len===10){
    if(mode==='fokus'||mode==='pepp') blocks.push({kind:'breathing',item:builtBreath46});
    blocks.push((mode==='lugn'||mode==='sömn')?{kind:'breathing',item:breath}:{kind:'micro',item:micro});
    blocks.push({kind:'thought-record'});
  }
  flowState.blocks=blocks;
}

function renderMainStep(){
  const len=flowState.sessionLengthMin;
  const blocks=flowState.blocks||[];
  const totalSteps=flowState.sessionLengthMin===3?3:4;
  let html=`<div class="card"><strong>Steg 2/${totalSteps}: Huvudövning</strong><div class="flow-note">Anpassat för ${len} min (${len===3?'~90–120s övning':len===6?'andning 2:00 + CBT-mini 2:00':'andning/mikro 3:00 + thought record'})</div>`;
  blocks.forEach((b,i)=>{
    if(b.kind==='breathing'||b.kind==='micro'){
      const item=b.item||{title:'Kort övning',steps:['Ta tre lugna andetag.']};
      html+=`<div class="ex-card" style="margin-top:12px;"><div class="ex-badge">${b.kind==='breathing'?'Andning':'Mikroverktyg'}</div><div class="ex-title">${item.title||'Övning'}</div><ul class="ex-steps">${(item.steps||[]).map((s,j)=>`<li class="ex-step"><span class="ex-step-num">${j+1}</span><span class="ex-step-txt">${s}</span></li>`).join('')}</ul></div>`;
    }
    if(b.kind==='cbt-mini') html+=renderCbtMini();
    if(b.kind==='thought-record') html+=renderThoughtRecord();
  });
  html+=`<button class="flow-btn" onclick="flowState.step=4;renderFlow()" style="margin-top:12px;">Klar → Avslut</button></div>`;
  return html;
}
function renderCbtMini(){
  const c=flowState.cbt;
  return `<div class="card" style="margin-top:12px;"><strong>CBT-mini (2:00)</strong>
  <input class="txt-in" placeholder="Situation (1 mening)" value="${c.situation||''}" oninput="updateCbt('situation',this.value)">
  <input class="txt-in" placeholder="Jobbigaste tanke" value="${c.tanke||''}" oninput="updateCbt('tanke',this.value)" style="margin-top:8px;">
  <input class="txt-in" placeholder="Mer hjälpsam tanke" value="${c.hjalp||''}" oninput="updateCbt('hjalp',this.value)" style="margin-top:8px;"></div>`;
}
function renderThoughtRecord(){
  const c=flowState.cbt;
  const f=[['tr1','1. Situation – vad hände?'],['tr2','2. Känslor – hur kändes det först?'],['tr3','3. Ohjälpsamma tankar'],['tr4','4. Bevis som stödjer tanken'],['tr5','5. Bevis emot tanken'],['tr6','6. Alternativ mer realistisk/neutral tanke'],['tr7','7. Hur känns det nu?']];
  return `<div class="card" style="margin-top:12px;"><strong>Thought record (7 steg)</strong>${f.map(([k,l])=>`<div style="margin-top:8px;"><div class="ci-label" style="text-transform:none;">${l}</div><textarea class="txt-in" style="min-height:64px;" oninput="updateCbt('${k}',this.value)">${c[k]||''}</textarea></div>`).join('')}</div>`;
}
function updateCbt(k,v){flowState.cbt=flowState.cbt||{};flowState.cbt[k]=v;}

function renderClosing(){
  const pre=flowState.preLocked||{};
  const cl=flowState.closing||{type:'single',source:{text:'Bra att du tog en paus.'}};
  const text=cl.type==='double'?(cl.source.lines||[]).map(l=>`<div class="closing-line">${l}</div>`).join(''):`<div class="closing-line">${cl.source.text||''}</div>`;
  return `<div class="closing-card">${text}</div>
    <div class="card"><strong>Steg ${flowState.sessionLengthMin===3?3:4}/${flowState.sessionLengthMin===3?3:4}: Post-rating</strong>
      <div style="margin-top:10px;">${['stress','humör'].map(k=>`<div class="ci-row"><div>${k}</div><input type="range" class="ci-slider" min="0" max="10" value="${flowState.post[k]??pre[k]??5}" oninput="updatePost('${k}',this.value)"><span class="ci-val">${flowState.post[k]??pre[k]??5}</span></div>`).join('')}</div>
      <button class="flow-btn" onclick="submitFlow()" style="margin-top:10px;">✅ Spara check</button>
      <button class="flow-btn-ghost" onclick="flowState.step=1;renderFlow()">Till startsidan</button>
    </div>`;
}
function updatePost(k,v){flowState.post=flowState.post||{};flowState.post[k]=parseInt(v,10)||0;renderFlow();}
function submitFlow(){
  const counted=!!flowState.counted && !getTodayCountedLog();
  const blocks=(flowState.blocks||[]).map(b=>({kind:b.kind,id:b.item?.id||null,title:b.item?.title||null}));
  const entry={
    date:ymd(),
    sessionLengthMin:flowState.sessionLengthMin,
    pre:flowState.preLocked||flowState.pre||{},
    post:flowState.post||{},
    mode:flowState.mode,
    themeGuess:flowState.themeGuess,
    blocks,
    closing:{type:flowState.closing?.type||'single',id:flowState.closing?.source?.id||null},
    cbt:(flowState.sessionLengthMin>=6?(localStorage.getItem('saveFreeTextLogs')==='1'?flowState.cbt:scrubFreeText(flowState.cbt)):undefined),
    completedAt:new Date().toISOString(),
    counted
  };
  const logs=loadFlowLogs(); logs.push(entry); saveFlowLogs(logs); if(counted)incStat('flow');
  showFlowComplete(counted);
}
function showFlowComplete(counted){const root=document.getElementById('flow-root');root.innerHTML=`<div class="flow-done-banner"><span class="flow-done-icon">🌟</span><div class="flow-done-title">Bra jobbat!</div><div class="flow-done-sub">${counted?'Dagens check räknades.':'Körd igen (räknades inte).'}</div><button class="flow-btn" onclick="startFlow(3,false)">Kör igen (räknas inte)</button></div>`;flowState.step=1;loadStats();}
function viewFlowHistory(){const logs=loadFlowLogs().slice(-7).reverse();const root=document.getElementById('flow-root');root.innerHTML=`<div class="card"><strong>📋 Senaste 7 checkar</strong><ul class="stat-list" style="margin-top:12px;">${logs.map(l=>`<li class="stat-item"><span>${l.date} · ${l.sessionLengthMin} min · ${l.mode||'-'}</span><span class="stat-val">${l.counted?'✓':'–'}</span></li>`).join('')||'<li class="stat-item"><span>Ingen historik ännu</span></li>'}</ul><button class="flow-btn-ghost" onclick="renderFlow()" style="margin-top:10px;">← Tillbaka</button></div>`;}

function scrubFreeText(value){const re=/(text|note|free|custom|other|notes|tr\d|situation|tanke|hjalp)/i;if(Array.isArray(value))return value.map(v=>scrubFreeText(v));if(value&&typeof value==='object'){const out={};Object.keys(value).forEach(k=>{out[k]=(re.test(k)&&typeof value[k]==='string')?'':scrubFreeText(value[k]);});return out;}return value;}
function setFlowStatus(msg){const el=document.getElementById('flow-status');if(!el)return;el.style.display='block';el.textContent=msg;setTimeout(()=>{el.style.display='none';},2600);} 
function clearFlowTextToday(){const logs=loadFlowLogs();const td=ymd();logs.forEach(l=>{if(l.date===td&&l.cbt)l.cbt=scrubFreeText(l.cbt);});saveFlowLogs(logs);setFlowStatus('Dagens fria text rensades.');}
function clearFlowTextLast7(){const logs=loadFlowLogs();const cutoff=Date.now()-6*24*3600*1000;logs.forEach(l=>{if(new Date(l.completedAt||0).getTime()>=cutoff&&l.cbt)l.cbt=scrubFreeText(l.cbt);});saveFlowLogs(logs);setFlowStatus('Fri text för senaste 7 dagar rensades.');}
// ══════════════════════════════════════════
//  EXPORT / IMPORT
// ══════════════════════════════════════════
function exportAll(){
  const data={
    _version:3,
    _exported:new Date().toISOString(),
    gratList:myGrat,
    quoteList:myQuotes,
    stats:JSON.parse(localStorage.getItem('stats')||'{}'),
    dailyFocus:JSON.parse(localStorage.getItem('dailyFocus')||'{}'),
    dailyFlowLogs:loadFlowLogs(),
    settings:{theme:localStorage.getItem('theme')||'auto',bioOn:localStorage.getItem('bioOn')||'0',saveFreeTextLogs:localStorage.getItem('saveFreeTextLogs')||'0'},
    localStorageDump:{...localStorage}
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='halsa-xyz-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(url);
}

function importFile(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(!data._version)throw new Error('Ogiltigt format');
      const choice=confirm('Välj:\nOK = Slå ihop (behåll befintlig data)\nAvbryt = Ersätt allt');
      if(choice){
        // Slå ihop
        if(data.localStorageDump){Object.entries(data.localStorageDump).forEach(([k,v])=>{if(localStorage.getItem(k)==null)localStorage.setItem(k,v);});}
        if(data.gratList)myGrat=[...new Set([...myGrat,...data.gratList])];
        if(data.quoteList)myQuotes=[...new Set([...myQuotes,...data.quoteList])];
        if(data.dailyFlowLogs){
          const existing=loadFlowLogs();
          const existingDates=new Set(existing.map(l=>`${l.date}|${l.completedAt||''}`));
          const newLogs=data.dailyFlowLogs.filter(l=>!existingDates.has(`${l.date}|${l.completedAt||''}`));
          saveFlowLogs([...existing,...newLogs]);
        }
      } else {
        // Ersätt
        if(data.localStorageDump){localStorage.clear();Object.entries(data.localStorageDump).forEach(([k,v])=>localStorage.setItem(k,v));}
        if(data.gratList)myGrat=data.gratList;
        if(data.quoteList)myQuotes=data.quoteList;
        if(data.stats)localStorage.setItem('stats',JSON.stringify(data.stats));
        if(data.dailyFocus)localStorage.setItem('dailyFocus',JSON.stringify(data.dailyFocus));
        if(data.dailyFlowLogs)saveFlowLogs(data.dailyFlowLogs);
        if(data.settings?.theme)setTheme(data.settings.theme);
        if(data.settings?.saveFreeTextLogs!==undefined){localStorage.setItem('saveFreeTextLogs',data.settings.saveFreeTextLogs);document.getElementById('freeTextToggle').checked=data.settings.saveFreeTextLogs==='1';}
      }
      saveL('gratList',myGrat);saveL('quoteList',myQuotes);
      alert('Import lyckades! ✅');renderLists();loadStats();
    }catch(err){alert('Import misslyckades: '+err.message);}
    input.value='';
  };
  reader.readAsText(file);
}

// ══════════════════════════════════════════
//  INSTÄLLNINGAR
// ══════════════════════════════════════════
function renderLists(){renderList('grat-list',myGrat,removeGrat);renderList('quote-list',myQuotes,removeQuote);}
function renderList(id,arr,fn){const el=document.getElementById(id);el.innerHTML='';arr.forEach((t,i)=>{const d=document.createElement('div');d.className='list-item';d.innerHTML='<span>'+t+'</span><button class="del-btn" onclick="('+fn.name+')('+i+')">✕</button>';el.appendChild(d);});}
function addGrat(){const i=document.getElementById('newGratIn');const v=i.value.trim();if(!v)return;myGrat.push(v);saveL('gratList',myGrat);i.value='';renderLists();}
function removeGrat(i){myGrat.splice(i,1);saveL('gratList',myGrat);renderLists();}
function addQuote(){const i=document.getElementById('newQuoteIn');const v=i.value.trim();if(!v)return;myQuotes.push(v);saveL('quoteList',myQuotes);i.value='';renderLists();}
function removeQuote(i){myQuotes.splice(i,1);saveL('quoteList',myQuotes);renderLists();}

// ══════════════════════════════════════════
//  HJÄLP DATA
// ══════════════════════════════════════════
const helpData=[
  {id:'h1',cat:'tankar',tags:['negativa tankar','grubbel','ifrågasätta'],title:'Hur tänker andra i samma situation?',preview:'Sätt dina tankar i perspektiv genom att fundera på vad andra skulle tänka.',detail:`<strong>Fråga dig själv:</strong><br>Hur tänker andra i en sådan här situation? Vad kan man förvänta sig av någon med dessa förutsättningar? Hur resonerar mina närmaste?<br><br><em>Tips: Tänk dig en god vän i din sits. Vad skulle du säga till hen?</em>`},
  {id:'h2',cat:'tankar',tags:['tankefälla','mönster','självkritik'],title:'Är detta ett tankemönster / en tankefälla?',preview:'Identifiera om du fastnat i ett negativt tankemönster.',detail:`<strong>Fråga dig:</strong><br>Är detta ett tankemönster? Vilken tankefälla är det? Varför kan man kalla det en tankefälla?<br><br>Se fliken <em>Tankefällor</em> för en komplett lista med lösningar.`},
  {id:'h3',cat:'verktyg',tags:['fakta','bevis','verklighet'],title:'Hur prövar jag riktigheten i mina föreställningar?',preview:'Skilj fakta från tankar och föreställningar.',detail:`<strong>Verktyg:</strong><br>Fråga dig: Är detta fakta som jag vet med säkerhet? Hur har jag kommit fram till denna tanke?<br><br>Vilka <em>bevis</em> finns för tankens giltighet? Vilka bevis talar <em>emot</em>? Hur kan jag ta reda på om det jag är övertygad om verkligen är sant?`},
  {id:'h4',cat:'verktyg',tags:['fakta','bevis','säkerhet','ursprung'],title:'Är detta fakta jag vet med säkerhet?',preview:'Undersök om dina övertygelser är grundade i fakta.',detail:`<strong>Undersök tanken:</strong><br>• Är detta fakta som jag vet med säkerhet?<br>• Hur har jag kommit fram till denna tanke?<br>• När dök denna tanke upp för första gången?<br>• Vilka bevis finns för tankens giltighet?<br>• Hur kan jag ta reda på om det jag är övertygad om verkligen är sant?`},
  {id:'h5',cat:'verktyg',tags:['scenario','värsta','bästa','realistiskt','sannolikhet'],title:'Värsta, troligaste och bästa scenariot',preview:'Skatta sannolikheten för olika utfall 0–100.',detail:`<strong>Tre scenarion:</strong><br><strong>A.</strong> Vad är det <em>värsta</em> som kan hända?<br><strong>B.</strong> Vad är det <em>troligaste</em>? Vad brukar hända?<br><strong>C.</strong> Vad är det <em>bästa</em> som kan hända?<br><br>Skatta sannolikheten 0–100. De flesta gånger är B mer sannolikt än vi tror.`},
  {id:'h6',cat:'tankar',tags:['tvärtom','omvänd','perspektiv'],title:'Tänk om! Kan det vara tvärtom?',preview:'Utmana din tanke genom att vända på den.',detail:`<strong>Övning:</strong><br>"Tänk om! Kan det vara tvärtom mot vad jag tänker?"<br><br>Formulera din negativa tanke. Formulera nu <em>exakt motsatsen</em>. Vilken av dem stöds bäst av bevis?`},
  {id:'h7',cat:'tankar',tags:['tid','förändring','framtid','perspektiv'],title:'Tänkte jag så här för ett år sedan?',preview:'Sätt tanken i ett tidsperspektiv.',detail:`<strong>Tidsperspektiv:</strong><br>Tänkte jag så här för ett år sedan? Hur skulle jag <em>vilja</em> tänka om ett år?<br><br>Ofta förändras saker mer än vi tror.`},
  {id:'h8',cat:'tankar',tags:['nyttig','hjälpsam','konstruktiv'],title:'Är detta en nyttig och bra tanke för mig?',preview:'Fråga om tanken tjänar dig eller stjälper dig.',detail:`<strong>Fråga dig:</strong><br>Är denna tanke nyttig och bra för mig? Hjälper den mig att nå mina mål eller må bra?<br><br>Även om en tanke är "sann" kan den vara skadlig att bära på.`},
  {id:'h9',cat:'verktyg',tags:['hjälp','andra','fråga','stöd'],title:'Vilken hjälp kan jag få av andra?',preview:'Utforska möjligheten att fråga om råd och stöd.',detail:`<strong>Socialt stöd:</strong><br>Vilken hjälp kan jag få av andra? Kan jag fråga vad de vet, hur de brukar göra?<br><br>Vi behöver inte lösa allt själva. Att be om hjälp är styrka.`},
  {id:'h10',cat:'verktyg',tags:['resurser','styrkor','problemlösning','kapacitet'],title:'Vilka egna resurser har jag?',preview:'Identifiera dina styrkor och hur du kan använda dem.',detail:`<strong>Dina resurser:</strong><br>Vilka egna resurser har du för att klara detta? Hur brukar du lösa problem? Vilka är dina <em>starka sidor</em>?<br><br>Skriv ned minst tre saker du är bra på eller har klarat förut.`},
  {id:'h11',cat:'tankar',tags:['krav','realistiska','perfektionism','acceptans'],title:'Vad kan jag begära av mig själv?',preview:'Sätt realistiska krav på dig själv.',detail:`<strong>Rimliga krav:</strong><br>Vad kan jag begära av mig själv i den här situationen? Vilka krav är realistiska? Måste jag klara allt perfekt?<br><br>Sikta på "tillräckligt bra" — inte perfekt.`},
  {id:'h12',cat:'tankar',tags:['kontroll','acceptans','oro','osäkerhet'],title:'Hur mycket kontroll behöver jag ha?',preview:'Utforska vad som faktiskt är möjligt att kontrollera.',detail:`<strong>Kontroll och acceptans:</strong><br>Hur mycket kontroll måste jag ha? Kan man ha fullständig kontroll — och behövs det?<br><br>Dela upp: <em>Kan jag påverka detta?</em> Om ja → agera. Om nej → öva acceptans.`},
  {id:'h13',cat:'tankar',tags:['positiv','omformulera','nytt perspektiv'],title:'Finns det en positiv tanke istället?',preview:'Hitta en alternativ, mer hjälpsam tanke.',detail:`<strong>Omformulering:</strong><br>Finns det någon positiv tanke jag kan tänka när det gäller mitt problem?<br><br>Hitta en <em>mer balanserad</em> och konstruktiv tanke att ersätta den negativa med.`},
  {id:'tf1',cat:'tankefallor',tags:['svart vitt','kategorisk','allt eller inget'],title:'Tankefälla 1: Svart-vitt tänkande',preview:'Du ser saker onyanserat — antingen/eller. "Ingen tycker om mig."',detail:`<strong>Vad det är:</strong><br>Du ser saker onyanserat, antingen–eller. <em>"Ingen tycker om mig."</em><br><br><strong>Hur du bryter den:</strong><br>Försök se gråskala. Använd hela spektrat 0–100 istället för svart/vitt.`},
  {id:'tf2',cat:'tankefallor',tags:['övergeneralisering','misslyckande','alltid','aldrig'],title:'Tankefälla 2: Övergeneralisering',preview:'Du ser en negativ händelse som ett tecken på att allt är fel.',detail:`<strong>Vad det är:</strong><br>Du ser <em>en</em> negativ händelse som ett tecken på att allt är fel.<br><br><strong>Hur du bryter den:</strong><br>Undersök konkreta belägg. Hur ofta har detta hänt?`},
  {id:'tf3',cat:'tankefallor',tags:['etikettering','bluff','negativ självbild'],title:'Tankefälla 3: Etikettering',preview:'Du ger dig själv och andra negativa generella etiketter.',detail:`<strong>Vad det är:</strong><br>Du tillskriver dig själv eller andra allmänna, negativa egenskaper. <em>"Jag är en bluff"</em>.<br><br><strong>Hur du bryter den:</strong><br>Beteenden är inte identiteter — du <em>gjorde</em> ett misstag, du <em>är</em> inte ett misstag.`},
  {id:'tf4',cat:'tankefallor',tags:['måsten','borden','perfektionism','krav'],title:'Tankefälla 4: Borden / Måsten',preview:'Du sätter orealistiska krav på dig själv med "måste" och "borde".',detail:`<strong>Vad det är:</strong><br>Du sätter orealistiska krav på dig själv.<br><br><strong>Hur du bryter den:</strong><br>Ersätt "måste/borde" med <em>"jag skulle vilja / det vore bra"</em>. Sänk kraven till 70 %. Fokusera på nuet.`},
  {id:'tf5',cat:'tankefallor',tags:['tankeläsning','andras tankar','belägg','antaganden'],title:'Tankefälla 5: Tankeläsning',preview:'Du tror att du vet vad andra tänker utan belägg.',detail:`<strong>Vad det är:</strong><br>Du tror att du vet vad andra tänker utan att ha belägg. <em>"Hon tycker inte om mig."</em><br><br><strong>Hur du bryter den:</strong><br>Sök alternativa förklaringar. Fråga andra direkt.`},
  {id:'tf6',cat:'tankefallor',tags:['känslotänkande','känsla','fakta','värdelös'],title:'Tankefälla 6: Känslotänkande',preview:'Du låter dina känslor styra verklighetsuppfattningen.',detail:`<strong>Vad det är:</strong><br>Du låter dina känslor styra verkligheten. <em>"Jag känner mig värdelös."</em><br><br><strong>Hur du bryter den:</strong><br>Skilj känsla från fakta. Känslor duger inte som bevis i en domstol.`},
  {id:'tf7',cat:'tankefallor',tags:['katastrofiering','oro','ångest','värsta'],title:'Tankefälla 7: Katastrofiering',preview:'Du tror att allt kommer gå åt skogen och att du inte kan fixa det.',detail:`<strong>Vad det är:</strong><br>Du tror att allt kommer gå åt skogen. <em>"Tänk om jag misslyckas"</em>.<br><br><strong>Hur du bryter den:</strong><br>Vad är det värsta som <em>faktiskt</em> kan hända? Skilj på möjligt och troligt.`},
  {id:'tf8',cat:'tankefallor',tags:['personifiering','självanklagelse','ansvar','skuld'],title:'Tankefälla 8: Personifiering och självanklagelse',preview:'Du tänker att allt handlar om dig eller är ditt fel.',detail:`<strong>Vad det är:</strong><br>Du tänker att allt är ditt ansvar och ditt fel.<br><br><strong>Hur du bryter den:</strong><br>Hur mycket ansvar har just du? Vad i situationen har kunnat bidra?`},
  {id:'tf9',cat:'tankefallor',tags:['selektiv perception','negativ','jämföra','positiv'],title:'Tankefälla 9: Selektiv perception',preview:'Du ser bara de negativa delarna och ignorerar det positiva.',detail:`<strong>Vad det är:</strong><br>Du ser bara de negativa delarna och ignorerar det positiva.<br><br><strong>Hur du bryter den:</strong><br>Gör en lista på det som är positivt. Schemalägg positiva aktiviteter.`},
  {id:'tf10',cat:'tankefallor',tags:['förstoring','förminskning','misslyckande','framgång'],title:'Tankefälla 10: Förstoring / Förminskning',preview:'Du förstoras dina misslyckanden och förminskar dina framgångar.',detail:`<strong>Vad det är:</strong><br>Du höjer en fjäder när du misslyckas och förringar framgångar.<br><br><strong>Hur du bryter den:</strong><br>Ge dig erkännande för framgångar och se motgångarna i ett större perspektiv.`}
];

let helpCat='all',helpQuery='';
state.helpCat=helpCat;
state.helpQuery=helpQuery;
function renderHelp(){
  const cont=document.getElementById('help-results');if(!cont)return;
  const q=helpQuery.toLowerCase();
  const items=helpData.filter(item=>{const matchCat=helpCat==='all'||item.cat===helpCat;const matchQ=!q||item.title.toLowerCase().includes(q)||item.preview.toLowerCase().includes(q)||item.detail.toLowerCase().includes(q)||item.tags.some(t=>t.includes(q));return matchCat&&matchQ;});
  if(items.length===0){cont.innerHTML='<div class="no-results">😔 Inget hittades för "'+helpQuery+'"<br><small>Prova ett annat sökord</small></div>';return;}
  const groups={};items.forEach(item=>{const gName=item.cat==='tankar'?'💭 Resonera med dina tankar':item.cat==='tankefallor'?'🪤 Tankefällor och hur man bryter dem':'🛠️ Verktyg & Övningar';if(!groups[gName])groups[gName]=[];groups[gName].push(item);});
  let html='';for(const [gTitle,gitems] of Object.entries(groups)){html+='<div class="card help-section">';html+='<div class="help-section-title">'+gTitle+'</div>';gitems.forEach(item=>{html+=`<div class="help-item" onclick="toggleHelpDetail('${item.id}')"><div class="help-item-title">${item.title}</div><div class="help-item-preview">${item.preview}</div><div style="margin-top:6px;">${item.tags.map(t=>'<span class="help-tag">'+t+'</span>').join('')}</div></div><div class="help-detail" id="hd-${item.id}"><div class="help-detail-text">${item.detail}</div></div>`;});html+='</div>';}
  cont.innerHTML=html;
}
function toggleHelpDetail(id){const el=document.getElementById('hd-'+id);if(el)el.classList.toggle('open');}
function filterHelp(q){helpQuery=q;state.helpQuery=q;renderHelp();}
function filterCat(cat,btn){helpCat=cat;state.helpCat=cat;document.querySelectorAll('.help-cat').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');renderHelp();}

Object.assign(window, {
  ud, pp, pd, sp, spd, tryBio, showTab, renderGratitude, startCustom, stopBreath,
  toggleSound, setVol, newQuote, filterCat, filterHelp, saveFocus, resetStats, setTheme, changePin,
  onBioToggle, onFreeTextToggle, importFile, exportAll, addGrat, addQuote, toggleHelpDetail, startFlow, startFlowAgain, renderFlow,
  lockAndStartFlow, updatePre, updateCbt, updatePost, submitFlow, viewFlowHistory,
  clearFlowTextToday, clearFlowTextLast7, openGuideTrigger, openGuideFromCheckin
});
