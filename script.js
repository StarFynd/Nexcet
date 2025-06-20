/* ===============  API KEYS  =============== */
const mediastackKey = "f4fe89cdeecdb9d8c1c9f51f1c65c1e7";
const gnewsKey      = "0dc86fce5370555738557352308711d8";      // ← paste your GNews key
const proxy         = "https://api.allorigins.win/raw?url="; // CORS helper

/* ===============  CACHE SETTINGS  =============== */
const cacheTimeMinutes = 30;  // minutes to keep data in localStorage

/* ===============  DOM REFERENCES  =============== */
const spinner       = document.getElementById("spinner");
const newsContainer = document.getElementById("news-container");

/* ===============  FETCH & RENDER  =============== */
async function fetchNews(category = "artificial-intelligence") {
  spinner.classList.remove("hidden");
  newsContainer.innerHTML = "";

  const cacheKey = `news_${category}`;
  const cached   = localStorage.getItem(cacheKey);
  const cachedAt = localStorage.getItem(`${cacheKey}_time`);
  const now      = Date.now();

  if (cached && cachedAt && now - cachedAt < cacheTimeMinutes * 60 * 1000) {
    renderCards(JSON.parse(cached));
    spinner.classList.add("hidden");
    return;
  }

  /* 1️⃣ try Mediastack */
  let data = await tryMediastack(category);

  /* 2️⃣ fallback to GNews */
  if (!data || !data.length) {
    data = await tryGNews(category);
  }

  if (data && data.length) {
    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(`${cacheKey}_time`, now.toString());
    renderCards(data);
  } else {
    newsContainer.innerHTML = "<p>No news found.</p>";
  }

  spinner.classList.add("hidden");
}

/* ---------- Provider helpers ---------- */
async function tryMediastack(category) {
  const url = `http://api.mediastack.com/v1/news?access_key=${mediastackKey}&categories=technology&keywords=${encodeURIComponent(category)}&limit=10`;
  try {
    const res = await fetch(proxy + encodeURIComponent(url));
    const json = await res.json();
    return json?.data || null;
  } catch (e) {
    console.warn("Mediastack error →", e);
    return null;
  }
}

async function tryGNews(category) {
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(category)}&token=${gnewsKey}&lang=en&max=10`;
  try {
    const res = await fetch(proxy + encodeURIComponent(url));
    const json = await res.json();
    if (json?.articles?.length) {
      // Map to Mediastack-like structure
      return json.articles.map(a => ({
        title:       a.title,
        description: a.description,
        image:       a.image,
        url:         a.url,
      }));
    }
  } catch (e) {
    console.warn("GNews error →", e);
  }
  return null;
}

/* ---------- Render helpers ---------- */
function renderCards(newsArray) {
  const englishOnly = newsArray.filter(article => {
    const text = `${article.title} ${article.description || ""}`;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    return englishChars / text.length > 0.6;   // ≥ 60 % English
  });

  const cards = englishOnly.map(createCard).join("");
  newsContainer.innerHTML = cards || "<p>No English news found.</p>";
}

function createCard(article) {
  const hasImg = article.image && article.image.trim() !== "";
  return `
    <div class="news-card"
         data-title="${escapeHtml(article.title)}"
         data-desc="${escapeHtml(article.description || '')}"
         data-img="${hasImg ? article.image : ''}"
         data-link="${article.url}">
      ${hasImg ? `<img class="news-thumb" src="${article.image}" alt="">` : ""}
      <div class="news-content">
        <h3>${article.title}</h3>
        <a href="#" class="read-more">Read more</a>
      </div>
    </div>
  `;
}

/* ---------- Modal logic ---------- */
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

/* ---------- Utility ---------- */
function escapeHtml(t){
  return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* ---------- UI listeners ---------- */
document.getElementById("category-select")
        .addEventListener("change", e => fetchNews(e.target.value));

document.getElementById("refresh-btn")
        .addEventListener("click", () => {
          const cat = document.getElementById("category-select").value;
          localStorage.removeItem(`news_${cat}`);
          localStorage.removeItem(`news_${cat}_time`);
          fetchNews(cat);
        });

/* ---------- INITIAL ---------- */
fetchNews();