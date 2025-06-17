/* ===============  CONFIG  =============== */
const apiKey = "f4fe89cdeecdb9d8c1c9f51f1c65c1e7";       // ← replace with your Mediastack key
const proxy  = "https://api.allorigins.win/raw?url="; // simple CORS proxy
const spinner = document.getElementById("spinner");
const newsContainer = document.getElementById("news-container");

/* ===============  FETCH & RENDER  =============== */
async function fetchNews(category = "artificial-intelligence") {
  spinner.classList.remove("hidden");
  newsContainer.innerHTML = "";

  const url = `http://api.mediastack.com/v1/news?access_key=${apiKey}&categories=technology&keywords=${encodeURIComponent(category)}&limit=10`;

  try {
    const res = await fetch(proxy + encodeURIComponent(url));
    const data = await res.json();

    // Build cards
    const cards = data.data.map(article => createCard(article)).join("");
    newsContainer.innerHTML = cards || "<p>No news found.</p>";
  } catch (err) {
    console.error(err);
    newsContainer.innerHTML = "<p>Failed to load news.</p>";
  } finally {
    spinner.classList.add("hidden");
  }
}

/* ===============  CARD TEMPLATE  =============== */
function createCard(article) {
  const img = article.image || "https://placehold.co/600x400?text=Nexcet";
  // store details in data-attrs for modal use
  return `
    <div class="news-card" 
         data-title="${escapeHtml(article.title)}"
         data-desc="${escapeHtml(article.description || '')}"
         data-img="${img}"
         data-link="${article.url}">
      <img class="news-thumb" src="${img}" alt="">
      <div class="news-content">
        <h3>${article.title}</h3>
        <a href="#" class="read-more">Read more</a>
      </div>
    </div>
  `;
}

/* ===============  MODAL LOGIC  =============== */
const modal      = document.getElementById("modal");
const modalClose = document.getElementById("modal-close");
const modalTitle = document.getElementById("modal-title");
const modalDesc  = document.getElementById("modal-desc");
const modalImg   = document.getElementById("modal-image");
const modalLink  = document.getElementById("modal-link");

// open modal from card click
newsContainer.addEventListener("click", (e) => {
  const card = e.target.closest(".news-card");
  if (!card) return;
  e.preventDefault();

  modalTitle.textContent = card.dataset.title;
  modalDesc.textContent  = card.dataset.desc || "No description available.";
  modalImg.src           = card.dataset.img;
  modalLink.href         = card.dataset.link;

  modal.classList.remove("hidden");
});

// close modal
modalClose.addEventListener("click", () => modal.classList.add("hidden"));
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.add("hidden");
});

/* ===============  HELPERS  =============== */
function escapeHtml(text){
  return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* ===============  EVENT LISTENERS  =============== */
document.getElementById("category-select").addEventListener("change", (e) => {
  fetchNews(e.target.value);
});

document.getElementById("refresh-btn").addEventListener("click", () => {
  const cat = document.getElementById("category-select").value;
  fetchNews(cat);
});

/* ===============  INITIAL LOAD  =============== */
fetchNews();