import HomePresenter from "./home-presenter";
import { getStories } from "../../data/api";
import { checkIfSubscribed } from "../../utils";
import Swal from "sweetalert2";
import Database from "../../data/database"; 

export default class HomePage {
  #presenter;
  #map;

  async render() {
    return `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <section id="main-content" class="main-content container">
        <p class="intro-text">Selamat datang di Aplikasi Cerita!</p>
        <p class="lead-text">Berikut peta dengan cerita dari seluruh dunia:</p>
        
        <div id="map"></div>
        
        <section id="stories-list" class="stories-list" aria-live="polite">
          <p>Sedang memuat cerita...</p>
        </section>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter({
      model: { getStories },
      view: this,
    });

    this.#presenter.init();

    const mainContent = document.querySelector("#main-content");
    const skipLink = document.querySelector(".skip-link");

    if (skipLink && mainContent) {
      skipLink.addEventListener("click", function (event) {
        event.preventDefault(); 
        skipLink.blur();
        if (!mainContent.hasAttribute("tabindex")) {
          mainContent.setAttribute("tabindex", "-1");
        }
        mainContent.focus();
        mainContent.scrollIntoView();
      });
    }
  }

  async renderStories(stories) {
  const storiesContainer = document.getElementById("stories-list");
  storiesContainer.innerHTML = "";

  if (!stories || stories.length === 0) {
    storiesContainer.innerHTML = `<p>Tidak ada cerita ditemukan.</p>`;
    return;
  }

  for (const story of stories) {
    const storyEl = document.createElement("article");
    storyEl.className = "story-card";
    storyEl.innerHTML = `
      <img src="${story.photoUrl}" 
           alt="Story photo uploaded by ${story.name}" 
           class="story-thumbnail" />
      <div class="story-body">
        <h3>${story.name}</h3>
        <p>${story.description}</p>
        <time datetime="${story.createdAt}">
          ${new Date(story.createdAt).toLocaleString()}
        </time>
        <button class="notify-btn">Tampilkan Notifikasi</button>
        <button class="save-btn">Simpan Cerita</button>
      </div>
    `;

    storyEl.querySelector(".notify-btn").addEventListener("click", async () => {
      const isSubscribed = await checkIfSubscribed();
      if (Notification.permission === "granted" && isSubscribed === true) {
        new Notification("Story berhasil dibuat", {
          body: `Anda telah membuat story baru dengan deskripsi: ${story.description}`,
          icon: story.photoUrl,
        });
      } else {
        Swal.fire({
          icon: "info",
          title: "Notifikasi Dinonaktifkan",
          text: "Anda belum berlangganan notifikasi. Silakan berlangganan untuk menerima notifikasi.",
        });
      }
    });

    this.renderSaveButton(story, storyEl.querySelector(".save-btn"));

    storiesContainer.appendChild(storyEl);
  }
}


  renderMap(lat, lon) {
    const L = require("leaflet");
    require("leaflet/dist/leaflet.css");

    this.#map = L.map("map").setView([lat, lon], 5);

    const osm = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "&copy; OpenStreetMap contributors" }
    ).addTo(this.#map);

    const topo = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      {
        attribution:
          "Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap",
      }
    );

    L.control.layers({ OSM: osm, Topo: topo }).addTo(this.#map);
  }

  addMarker(story) {
    if (!story.lat || !story.lon) return;

    const L = require("leaflet");
    const marker = L.marker([story.lat, story.lon]).addTo(this.#map);
    marker.bindTooltip(story.description, { permanent: false });
    marker.bindPopup(`
      <article role="dialog" aria-label="Story popup">
        <figure>
          <img src="${story.photoUrl}" 
               alt="Story photo uploaded by ${story.name}" 
               style="width:100px; height:auto;" />
          <figcaption>
            <h4>${story.name}</h4>
            <p>${story.description.substring(0, 50)}...</p>
            <time datetime="${story.createdAt}">
              ${new Date(story.createdAt).toLocaleString()}
            </time>
          </figcaption>
        </figure>
      </article>
    `);

    marker.on("add", () => {
      const markerEl = marker.getElement();
      if (markerEl) {
        markerEl.setAttribute("tabindex", "0");
        markerEl.setAttribute("role", "button");
        markerEl.setAttribute("aria-label", `Story marker by ${story.name}`);
        markerEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            marker.openPopup();
          }
        });
      }
    });
  }

  async renderSaveButton(story, button) {
  const existingStory = await Database.getStoryById(story.id);

  if (existingStory) {
    button.textContent = "Cerita Tersimpan";
    button.disabled = false;
    button.classList.add("saved");

    button.addEventListener("click", async () => {
      await Database.deleteStory(story.id);
      button.textContent = "Simpan Cerita";
      button.classList.remove("saved");
      Swal.fire({
        icon: "info",
        title: "Bookmark Dihapus",
        text: "Cerita telah dihapus dari bookmark.",
        timer: 1500,
        showConfirmButton: false,
      });
    });
  } else {
    button.textContent = "Simpan Cerita";
    button.disabled = false;
    button.classList.remove("saved");

    button.addEventListener("click", async () => {
      await Database.putStory(story);
      button.textContent = "Cerita Tersimpan";
      button.classList.add("saved");

      Swal.fire({
        icon: "success",
        title: "Cerita Disimpan",
        text: "Cerita telah berhasil disimpan untuk dibaca nanti.",
        timer: 2000,
        showConfirmButton: false,
      });
    });
  }
}

}
