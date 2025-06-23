/* ========= 1. Put REAL keys here ========= */
const msKey = "f4fe89cdeecdb9d8c1c9f51f1c65c1e7";
const gKey  = "0dc86fce5370555738557352308711d8";

/* ========= 2. Constants ========= */
const proxy="https://api.allorigins.win/raw?url=";
const PAGE=10,CACHE_MIN=30,EN=.6;

/* -------- ROUTE→keyword map -------- */
const KEY={home:"technology","artificial-intelligence":"artificial-intelligence",cybersecurity:"cybersecurity",
games:"gaming",software:"software",hardware:"hardware",startups:"startup",leaders:"tech leaders",inventions:"invention"};

/* -------- DOM refs -------- */
const view=document.getElementById("view");
const burger=document.getElementById("burger");
const drawer=document.getElementById("drawer");

/* -------- State -------- */
let route="home",page=1,loading=false,end=false;
const cache={}; // {route:{page:[...] }}

/* -------- Helpers -------- */
const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const isEn=t=> ( (t.match(/[a-zA-Z]/g)||[]).length / t.length ) > EN;

/* ===== Drawer ===== */
burger.onclick=()=>drawer.classList.toggle("open");
drawer.onclick=e=>{if(e.target.tagName==="A")drawer.classList.remove("open");};

/* ===== Router ===== */
window.addEventListener("hashchange",router);
function router(){
  if(location.hash.startsWith("#article/")) return showArticle(decodeURIComponent(location.hash.split("/")[1]));
  route=location.hash.slice(1)||"home"; page=1; end=false;
  view.innerHTML=`<div id="feed"></div><div id="spinner">Loading…</div>`;
  loadPage();
}
router();

/* ===== Scroll ===== */
window.onscroll=()=>{
  if(loading||end||location.hash.startsWith("#article/"))return;
  if(window.innerHeight+window.scrollY>=document.body.offsetHeight-200){page++;loadPage();}
};

/* ===== Load page ===== */
async function loadPage(){
  loading=true;document.getElementById("spinner").classList.remove("hidden");
  const kw=KEY[route]||"technology"; const key=`${route}_${page}`;
  const ts=+localStorage.getItem(key+"_ts")||0;
  if(cache[route]?.[page]){render(cache[route][page]);return finish();}
  if(Date.now()-ts < CACHE_MIN*60*1000){
     const data=JSON.parse(localStorage.getItem(key)||"[]"); render(data); return finish();}
  let list=await fetchMS(kw,page); if(!list.length)list=await fetchGN(kw,page);
  cache[route]??={}; cache[route][page]=list;
  localStorage.setItem(key,JSON.stringify(list));localStorage.setItem(key+"_ts",Date.now());
  render(list); if(list.length<PAGE)end=true; finish();
}
function finish(){document.getElementById("spinner").classList.add("hidden");loading=false;}

/* ===== Providers ===== */
async function fetchMS(k,p){try{const off=(p-1)*PAGE;
  const r=await fetch(proxy+encodeURIComponent(`http://api.mediastack.com/v1/news?access_key=${msKey}&keywords=${encodeURIComponent(k)}&limit=${PAGE}&offset=${off}`));
  return (await r.json()).data||[]}catch{return[]}}
async function fetchGN(k,p){try{
  const r=await fetch(proxy+encodeURIComponent(`https://gnews.io/api/v4/search?q=${encodeURIComponent(k)}&token=${gKey}&lang=en&max=${PAGE}&page=${p}`));
  return (await r.json()).articles.map(a=>({title:a.title,description:a.description,image:a.image,url:a.url}))}catch{return[]}}

/* ===== Render ===== */
function render(list){
  const feed=document.getElementById("feed");
  list.filter(a=>isEn(`${a.title} ${a.description||""}`)).forEach(a=>{
    const host=new URL(a.url).hostname.replace(/^www\\./,"");
    feed.insertAdjacentHTML("beforeend",
      `<div class="news-card" data-url="${a.url}">
         ${a.image?`<img src="${a.image}" loading="lazy">`:""}
         <h3>${esc(a.title)}</h3>
         <p class="article-meta">${host}</p>
       </div>`);
  });
}

/* ===== Card click => article ===== */
view.onclick=e=>{
  const card=e.target.closest(".news-card"); if(!card)return;
  location.hash=`article/${encodeURIComponent(card.dataset.url)}`;
};

/* ===== Article view ===== */
function showArticle(url){
  const art=find(url); if(!art){history.back();return;}
  const host=new URL(art.url).hostname.replace(/^www\\./,"");
  view.innerHTML=`<button id="back">← Back</button>
    <article class="article-full">
      ${art.image?`<img src="${art.image}">`:""}
      <h2>${esc(art.title)}</h2>
      <p class="article-meta">${host}</p>
      <p>${esc(art.description||"No description.")}</p>
      <a href="${art.url}" target="_blank">Read original ↗</a>
    </article>`;
  document.getElementById("back").onclick=()=>history.back();
}
function find(u){return cache[route]&&Object.values(cache[route]).flat().find(a=>a.url===u);}