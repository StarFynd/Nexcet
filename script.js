const apiKey = '0dc86fce5370555738557352308711d8'; // Replace with your actual GNews API key
const apiUrl = 'https://gnews.io/api/v4/top-headlines';
const categories = {
  home: 'general',
  'artificial-intelligence': 'technology',
  cybersecurity: 'technology',
  games: 'technology',
  software: 'technology',
  hardware: 'technology',
  startups: 'technology',
  innovations: 'science',
  companies: 'business',
  leaders: 'technology',
};

let currentCategory = 'home';
let articles = [];
let page = 1;
let perPage = 10;
let loading = false;

const main = document.getElementById('main');
const drawerLinks = document.querySelectorAll('.drawer a');
const burger = document.getElementById('burger');
const drawer = document.getElementById('drawer');
const spinner = document.getElementById('spinner');

burger.addEventListener('click', () => {
  drawer.classList.toggle('open');
});

drawerLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const hash = link.getAttribute('href').substring(1);
    currentCategory = hash;
    articles = [];
    page = 1;
    main.innerHTML = '';
    drawer.classList.remove('open');
    loadArticles();
  });
});

async function loadArticles() {
  if (loading) return;
  loading = true;
  spinner.classList.remove('hidden');

  const category = categories[currentCategory] || 'general';
  const url = `${apiUrl}?category=${category}&lang=en&max=${perPage}&page=${page}&token=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const newArticles = data.articles.filter(article => {
      return !articles.some(a => a.title === article.title);
    });

    articles = [...articles, ...newArticles];
    renderArticles(newArticles);
    page++;
  } catch (err) {
    console.error(err);
    main.innerHTML = '<p style="padding:20px; text-align:center;">Failed to load news. Please try again later.</p>';
  } finally {
    spinner.classList.add('hidden');
    loading = false;
  }
}

function renderArticles(newsItems) {
  newsItems.forEach(article => {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.innerHTML = `
      ${article.image ? `<img src="${article.image}" alt="">` : ''}
      <h3>${article.title}</h3>
      <div class="article-meta">${article.source.name} • ${new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    card.addEventListener('click', () => openArticle(article));
    main.appendChild(card);
  });
}

function openArticle(article) {
  main.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'article-full';
  container.innerHTML = `
    <button id="back">← Back</button>
    ${article.image ? `<img src="${article.image}" alt="">` : ''}
    <h2>${article.title}</h2>
    <div class="article-meta">${article.source.name} • ${new Date(article.publishedAt).toLocaleString()}</div>
    <p>${article.description || 'No description available.'}</p>
    ${article.url ? `<p><a href="${article.url}" target="_blank">Read original source</a></p>` : ''}
  `;

  main.appendChild(container);
  document.getElementById('back').addEventListener('click', () => {
    main.innerHTML = '';
    page = 1;
    articles = [];
    loadArticles();
  });
}

window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    loadArticles();
  }
});

// Load default category
loadArticles();

// Load Lucide icons
lucide.createIcons();