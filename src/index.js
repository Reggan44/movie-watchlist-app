const BASE_URL = "https://movie-watchlist-app.onrender.com/movies";
let movieData = [];

// DOM Elements 
const modal = document.getElementById("modal");
const openModalBtn = document.getElementById("open-modal");
const closeModalBtn = document.getElementById("close-modal");
const toast = document.getElementById("toast");
const form = document.getElementById("movie-form");
const titleInput = document.getElementById("title");
const genreInput = document.getElementById("genre");
const posterInput = document.getElementById("poster");
const movieList = document.getElementById("movie-list");
const sortSelect = document.getElementById("sort");
const descriptionInput = document.getElementById("description");
const trailerInput = document.getElementById("trailer");

// Modal Logic 
openModalBtn.addEventListener("click", () => modal.style.display = "flex");
closeModalBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

//  Add Movie 
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const genre = genreInput.value.trim();
  const poster = posterInput.value.trim() || "https://via.placeholder.com/100x150?text=No+Image";
  const description = descriptionInput.value.trim();
  const trailer = trailerInput.value.trim();

  const duplicate = movieData.some(movie => movie.title.toLowerCase() === title.toLowerCase());
  if (duplicate) {
    alert("Movie already exists!");
    return;
  }

  const newMovie = { title, genre, watched: false, poster, description, trailer };

  fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newMovie)
  })
    .then(res => res.json())
    .then(movie => {
      movieData.push(movie);
      renderMovieList(movieData);
      form.reset();
      modal.style.display = "none";
      showToast("Movie added!");
    });
});

// Display Movies 
function displayMovies() {
  fetch(BASE_URL)
    .then(res => res.json())
    .then(data => {
      movieData = data;
      renderMovieList(data);
    });
}

function renderMovieList(movies) {
  movieList.innerHTML = "";

  const filter = sortSelect.value;
  const filtered = movies.filter(movie =>
    filter === "all" ||
    (filter === "watched" && movie.watched) ||
    (filter === "unwatched" && !movie.watched)
  );

  filtered.forEach(movie => {
    const li = document.createElement("li");
    li.className = "movie-card";
    li.dataset.id = movie.id;
    li.dataset.watched = movie.watched;

    li.innerHTML = `
      <div class="movie-info" style="display: flex; gap: 20px;">
        <img src="${movie.poster}" alt="${movie.title}" width="100" height="140">
        <div>
          <h3>${movie.title}</h3>
          <p><strong>Genre:</strong> ${movie.genre}</p>
          <p><strong>Status:</strong> ${movie.watched ? " Watched" : " Unwatched"}</p>
        </div>
      </div>
      <div class="movie-actions">
        <button onclick="toggleWatched('${movie.id}', ${movie.watched}); event.stopPropagation();"> Mark</button>
        <button onclick="deleteMovie('${movie.id}'); event.stopPropagation();"> Delete</button>
        <button onclick="editMovie('${movie.id}'); event.stopPropagation();"> Edit</button>
        <button onclick="toggleDetails('${movie.id}'); event.stopPropagation();">ℹ More Info</button>
      </div>
      <div id="details-${movie.id}" class="movie-detail" style="display: none;"></div>
    `;

    movieList.appendChild(li);
  });
}

//  More Info Toggle Logic 
function toggleDetails(id) {
  const movie = movieData.find(m => m.id === id);
  const container = document.getElementById(`details-${id}`);
  if (!movie || !container) return;

  const isVisible = container.style.display === "block";
  if (isVisible) {
    container.style.display = "none";
    container.innerHTML = "";
  } else {
    const trailer = convertToEmbedURL(movie.trailer);

    container.innerHTML = `
      <div class="detail-container">
        ${trailer ? `<iframe width="100%" height="300" src="${trailer}" frameborder="0" allowfullscreen></iframe>` : ""}
        <div class="description-box">
          <h2>${movie.title}</h2>
          <p><strong>Genre:</strong> ${movie.genre}</p>
          <p>${movie.description || "No description available."}</p>
        </div>
      </div>
    `;
    container.style.display = "block";
  }
}
window.toggleDetails = toggleDetails;

//  Toggle Watched 
function toggleWatched(id, currentStatus) {
  fetch(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ watched: !currentStatus })
  })
    .then(res => res.json())
    .then(() => displayMovies());
}
window.toggleWatched = toggleWatched;

//  Delete Movie 
function deleteMovie(id) {
  fetch(`${BASE_URL}/${id}`, { method: "DELETE" })
    .then(() => displayMovies());
}
window.deleteMovie = deleteMovie;

//  Toast Message 
function showToast(message) {
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => toast.style.display = "none", 2500);
}

//  Filter Listener 
sortSelect.addEventListener("change", () => renderMovieList(movieData));

//  Init 
displayMovies();

// Convert Youtube URL to Embed URL 
function convertToEmbedURL(url) {
  if (!url) return "";
  const videoIdMatch = url.match(/(?:youtu\.be\/|v=|embed\/)([^&?/]+)/);
  return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}` : "";
}

//  Edit Movie 
function editMovie(id) {
  const movie = movieData.find(m => m.id === id);
  if (!movie) return;

  // Open modal and pre-fill form
  modal.style.display = "flex";
  titleInput.value = movie.title;
  genreInput.value = movie.genre;
  posterInput.value = movie.poster;
  descriptionInput.value = movie.description || "";
  trailerInput.value = movie.trailer || "";

  // Overwrite form submit only for this edit
  form.onsubmit = function (e) {
    e.preventDefault();

    const updatedTitle = titleInput.value.trim();
    const updatedGenre = genreInput.value.trim();
    const updatedPoster = posterInput.value.trim();
    const updatedDescription = descriptionInput.value.trim();
    const updatedTrailer = trailerInput.value.trim();

    // Skip duplicate check for same movie
    const isDuplicate = movieData.some(
      m => m.id !== id && m.title.toLowerCase() === updatedTitle.toLowerCase()
    );

    if (isDuplicate) {
      alert("Another movie with this title already exists.");
      return;
    }

    const updatedMovie = {
      title: updatedTitle,
      genre: updatedGenre,
      poster: updatedPoster,
      description: updatedDescription,
      trailer: updatedTrailer,
      watched: movie.watched
    };

    fetch(`${BASE_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedMovie)
    })
      .then(res => res.json())
      .then(() => {
        modal.style.display = "none";
        showToast(" Movie updated!");
        displayMovies();
        // Restore form submit to add movie after editing
        form.onsubmit = null;
      });
  };
}
window.editMovie = editMovie;