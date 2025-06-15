const apiKey = "f4fe89cdeecdb9d8c1c9f51f1c65c1e7";
const apiUrl = `http://api.mediastack.com/v1/news?access_key=${apiKey}&categories=technology&languages=en&limit=10`;

async function loadNews() {
  const container = document.getElementById("news-container");

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    container.innerHTML = "";

    data.data.forEach((article) => {
      const card = document.createElement("div");
      card.className = "news-card";

      card.innerHTML = `
        <h3>${article.title}</h3>
        <p>${article.description || "No description available."}</p>
        <a href="${article.url}" target="_blank">Read more</a>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = "Failed to load news.";
    console.error("Error fetching news:", err);
  }
}

loadNews();