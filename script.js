/* ===== KEYS & CONST ===== */
const msKey = "f4fe89cdeecdb9d8c1c9f51f1c65c1e7";
const gKey  = "0dc86fce5370555738557352308711d8";
const proxy = "https://api.allorigins.win/raw?url=";
const PAGE  = 10, CACHE=30, EN=0.6;

/* ===== ROUTES ===== */
const KEY={home:"technology","artificial-intelligence":"artificial-intelligence",cybersecurity:"cybersecurity",
games:"gaming",software:"software",hardware:"hardware",startups:"startup",leaders:"tech leaders",inventions:"invention"};

const view   = document.getElementById("view");
const burger = document.getElementById("burger");
const drawer = document.getElementById("drawer");

burger.onclick = ()=> drawer.classList.toggle("open");
drawer.addEventListener("click",e=>{if(e.target.tagName==="A")drawer.classList.remove("open")});

/* ===== SPA ROUTER ===== */
window.addEventListener("hashchange",router);
router(); // first load

let pages={}; // cache per route {pageN:[]}
let page=1,end=false,loading=false,route="home";

function router(){
  route=location.hash.replace("#","")||"home";
  if(route.startsWith("article/")) return showArticle(decodeURIComponent(route.split("/")[1]));
  // reset feed
  page=1;end=false;view.innerHTML="<div id='feed'></div><div id='spinner'>Loading…</div>";
  pages[route]??={}; document.getElementById("spinner").classList.remove("hidden");
  loadPage();
}

window.addEventListener("scroll",()=>{
 if(loading||end||location.hash.startsWith("#article"))return;
 if(window.innerHeight+window.scrollY>=document.body.offsetHeight-150){page++;loadPage();}
});

/* ===== LOAD PAGE ===== */
async function loadPage(){
 loading=true;
 if(pages[route][page]){render(pages[route][page]);return;}
 const kw=KEY[route]||"technology";
 let list=await fetchMS(kw,page); if(!list.length)list=await fetchGN(kw,page);
 pages[route][page]=list; render(list);
}

function render(list){
 const feed=document.getElementById("feed");
 list.filter(enOnly).forEach(a=>feed.insertAdjacentHTML("beforeend",card(a)));
 if(list.length<PAGE)end=true;
 document.getElementById("spinner").classList.add("hidden");
 loading=false;
}

/* ===== CARD & ARTICLE ===== */
function card(a){
 const img=a.image&&a.image.trim();const host=new URL(a.url).hostname.replace(/^www\\./,'');
 return `<div class='news-card' data-url='${a.url}'><h3>${a.title}</h3>
  ${img?`<img src='${img}' loading='lazy'>`:''}
  <p class='article-meta'>${host}</p></div>`;
}

view.addEventListener("click",e=>{
 const card=e.target.closest(".news-card"); if(!card)return;
 location.hash=`article/${encodeURIComponent(card.dataset.url)}`;
});

function showArticle(src){
 const art=findArticle(src); if(!art){location.hash="#"+route;return;}
 const host=new URL(art.url).hostname.replace(/^www\\./,'');
 view.innerHTML=`<button id='back'>&larr; Back</button>
  <article class='article-full'>
    ${art.image?`<img src='${art.image}'/>`:""}
    <h2>${art.title}</h2>
    <p class='article-meta'>${host}</p>
    <p>${art.description||"No description available."}</p>
    <a href='${art.url}' target='_blank'>Read original ↗</a>
  </article>`;
 document.getElementById("back").onclick=()=>history.back();
}

function findArticle(url){
 for(const p in pages[route]){const f=pages[route][p].find(x=>x.url===url);if(f)return f;}
 return null;
}

/* ===== PROVIDERS ===== */
async function fetchMS(k,p){const off=(p-1)*PAGE,url=`http://api.mediastack.com/v1/news?access_key=${msKey}&keywords=${encodeURIComponent(k)}&limit=${PAGE}&offset=${off}`;try{const r=await fetch(proxy+encodeURIComponent(url));return (await r.json()).data||[]}catch{ return[]}}
async function fetchGN(k,p){const url=`https://gnews.io/api/v4/search?q=${encodeURIComponent(k)}&token=${gKey}&lang=en&max=${PAGE}&page=${p}`;try{const r=await fetch(proxy+encodeURIComponent(url));return (await r.json()).articles.map(a=>({title:a.title,description:a.description,image:a.image,url:a.url}))}catch{return[]}}
function enOnly(a){const t=`${a.title} ${a.description||''}`;const en=(t.match(/[a-zA-Z]/g)||[]).length;return en/t.length>EN;}