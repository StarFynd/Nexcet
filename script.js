/* ---------- KEYS ---------- */
const mediastackKey = "f4fe89cdeecdb9d8c1c9f51f1c65c1e7";
const gnewsKey      = "0dc86fce5370555738557352308711d8";
const proxy         = "https://api.allorigins.win/raw?url=";   // CORS helper

/* ---------- CACHE ---------- */
const CACHE_MINUTES = 30;

/* ---------- DOM ---------- */
const spinner       = document.getElementById("spinner");
const newsContainer = document.getElementById("news-container");

/* ---------- STATE ---------- */
let currentCat   = "artificial-intelligence";
let currentPage  = 1;
let loading      = false;
let endOfFeed    = false;

/* ---------- MAIN FETCH ---------- */
async function loadPage(cat = currentCat, page = 1) {
  if (loading || endOfFeed) return;
  loading = true;
  spinner.classList.remove("hidden");

  const cacheKey = `news_${cat}_${page}`;
  const cached   = localStorage.getItem(cacheKey);
  const cachedAt = localStorage.getItem(`${cacheKey}_time`);
  const now      = Date.now();

  let articles;

  if (cached && cachedAt && now - cachedAt < CACHE_MINUTES * 60 * 1000) {
    articles = JSON.parse(cached);
  } else {
    articles = await fetchFromProviders(cat, page);
    if (articles) {
      localStorage.setItem(cacheKey, JSON.stringify(articles));
      localStorage.setItem(`${cacheKey}_time`, now.toString());
    }
  }

  if (articles && articles.length) {
    appendCards(articles);
    if (articles.length < 10) endOfFeed = true;          // no more pages
  } else if (page === 1) {
    newsContainer.innerHTML = "<p>No English news found.</p>";
  } else {
    endOfFeed = true;
  }

  spinner.classList.add("hidden");
  loading = false;
}

/* ---------- Provider wrapper ---------- */
async function fetchFromProviders(cat, page) {
  const msData = await tryMediastack(cat, page);
  if (msData && msData.length) return msData;

  const gData = await tryGNews(cat, page);
  return gData;
}

async function tryMediastack(cat, page) {
  const offset = (page - 1) * 10;
  const url = `http://api.mediastack.com/v1/news?access_key=${mediastackKey}&categories=technology&keywords=${encodeURIComponent(cat)}&limit=10&offset=${offset}`;
  try {
    const res = await fetch(proxy + encodeURIComponent(url));
    const json = await res.json();
    return json?.data || null;
  } catch (e) {
    console.warn("Mediastack error", e);
    return null;
  }
}

async function tryGNews(cat, page) {
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(cat)}&token=${gnewsKey}&lang=en&max=10&page=${page}`;
  try {
    const res = await fetch(proxy + encodeURIComponent(url));
    const json = await res.json();
    if (json?.articles?.length) {
      return json.articles.map(a => ({
        title: a.title,
        description: a.description,
        image: a.image,
        url: a.url,
      }));
    }
  } catch (e) {
    console.warn("GNews error", e);
  }
  return null;
}

/* ---------- RENDER ---------- */
function appendCards(list) {
  const englishOnly = list.filter(a => {
    const text = `${a.title} ${a.description || ""}`;
    const en = (text.match(/[a-zA-Z]/g) || []).length;
    return en / text.length > 0.6;
  });

  const html = englishOnly.map(cardTemplate).join("");
  newsContainer.insertAdjacentHTML("beforeend", html);
}

function cardTemplate(a) {
  const img = a.image && a.image.trim() !== "";
  return `
    <div class="news-card"
         data-title="${escapeHtml(a.title)}"
         data-desc="${escapeHtml(a.description || '')}"
         data-img="${img ? a.image : ''}"
         data-link="${a.url}">
      ${img ? `<img class="news-thumb" src="${a.image}" alt="">` : ""}
      <div class="news-content">
        <h3>${a.title}</h3>
        <a href="#" class="read-more">Read more</a>
      </div>
    </div>
  `;
}

/* ---------- MODAL ---------- */
const modal      = document.getElementById("modal");
const modalClose = document.getElementById("modal-close");
const modalTitle = document.getElementById("modal-title");
const modalDesc  = document.getElementById("modal-desc");
const modalImg   = document.getElementById("modal-image");
const modalLink  = document.getElementById("modal-link");

newsContainer.addEventListener("click", e => {
  const card = e.target.closest(".news-card");
  if (!card) return;
  e.preventDefault();

  modalTitle.textContent = card.dataset.title;
  modalDesc.textContent  = card.dataset.desc || "No description available.";
  modalLink.href         = card.dataset.link;

  if (card.dataset.img) {
    modalImg.src = card.dataset.img;
    modalImg.style.display = "block";
  } else {
    modalImg.style.display = "none";
  }
  modal.classList.remove("hidden");
});

modalClose.addEventListener("click", () => modal.classList.add("hidden"));
modal.addEventListener("click", e => { if (e.target === modal) modal.classList.add("hidden"); });

/* ---------- UTIL ---------- */
function escapeHtml(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

/* ---------- EVENTS ---------- */
document.getElementById("category-select").addEventListener("change", e => {
  currentCat  = e.target.value;
  currentPage = 1;
  endOfFeed   = false;
  newsContainer.innerHTML = "";
  loadPage(currentCat, currentPage);
});

document.getElementById("refresh-btn").addEventListener("click", () => {
  localStorage.clear();            // clear all caches
  currentPage = 1;
  endOfFeed   = false;
  newsContainer.innerHTML = "";
  loadPage(currentCat, currentPage);
});

/* Infinite scroll listener */
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 150) {
    if (!loading && !endOfFeed) {
      currentPage += 1;
      loadPage(currentCat, currentPage);
    }
  }
});

/* ---------- INITIAL ---------- */
loadPage(currentCat, currentPage);