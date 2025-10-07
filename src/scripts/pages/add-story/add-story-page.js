import AddStoryPresenter from "./add-story-presenter";
import { addStory, getStories } from "../../data/api";
import Swal from "sweetalert2";
import { checkIfSubscribed } from "../../utils";
import Database from "../../data/database"; 

export default class AddStoryPage {
  async render() {
    return `
    <a href="#story-form" class="skip-link">Skip to main content</a>
      <section class="container">
        <p class="intro-text">Bagikan cerita Anda dengan orang lain!</p>
        <p class="lead-text">Unggah cerita Anda beserta foto untuk dibagikan ke seluruh dunia:</p>
        
        <form id="story-form" aria-label="Add new story form" enctype="multipart/form-data">
          <label for="desc">Description</label>
          <input id="desc" name="desc" type="text" placeholder="Write description" required />

          <label for="photo">Upload Photo</label>
          <input id="photo" name="photo" type="file" accept="image/*" />

          <p>Or Take Photo:</p>
          <video id="video" width="250" autoplay playsinline style="display:none;"></video>
          <canvas id="canvas" style="display:none;"></canvas>
          <img id="preview" alt="Preview photo before upload" style="display:none; max-width:200px;" />

          <div class="form-button-group">
            <button id="open-camera" type="button">Open Camera</button>
            <button id="capture" type="button" style="display:none;">Capture</button>
          </div>

          <p>Select Location on Map</p>
          <div id="map" style="height: 400px; margin: 0.5rem 0;"></div>

          <label for="lat">Latitude</label>
          <input id="lat" name="lat" type="text" readonly />

          <label for="lon">Longitude</label>
          <input id="lon" name="lon" type="text" readonly />

          <div class="form-button-group">
            <button type="submit">Submit</button>
            <button type="reset">Cancel</button>
          </div>
        </form>
      </section>

      <section id="stories-list" class="stories-list" aria-live="polite">
        <p>Sedang memuat cerita...</p>
      </section>
    `;
  }

  async afterRender() {
    this.presenter = new AddStoryPresenter({
      view: this,
      model: { addStory, getStories },
    });

    this.presenter.init();
    this.setupFormEvents();

    const storyForm = document.querySelector("#story-form");
    const skipLink = document.querySelector(".skip-link");

    if (skipLink && storyForm) {
      skipLink.addEventListener("click", function (event) {
        event.preventDefault(); 
        skipLink.blur(); 

        if (!storyForm.hasAttribute("tabindex")) {
          storyForm.setAttribute("tabindex", "-1");
        }

        storyForm.focus(); 
        storyForm.scrollIntoView(); 
      });
    }

    document.addEventListener("visibilitychange", this.handleVisibility);
  }

  handleVisibility = () => {
    if (document.hidden) {
      this.stopCamera();
    }
  };

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

  showError(message) {
    const container = document.getElementById("stories-list");
    container.innerHTML = `<p>${message}</p>`;
  }

  setupFormEvents() {
    const openCamBtn = document.getElementById("open-camera");
    const captureBtn = document.getElementById("capture");
    const video = document.getElementById("video");
    const previewImg = document.getElementById("preview");
    const fileInput = document.getElementById("photo");
    const form = document.getElementById("story-form");

    previewImg.style.display = "none";

    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        previewImg.src = URL.createObjectURL(e.target.files[0]);
        previewImg.style.display = "block";
      } else {
        previewImg.style.display = "none";
      }
    });

    openCamBtn.addEventListener("click", async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        Swal.fire(
          "Error",
          "Camera API tidak tersedia karena alasan keamanan. Coba buka lewat https:// atau http://localhost",
          "error"
        );
        return;
      }

      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        video.srcObject = this.stream;
        video.style.display = "block";
        captureBtn.style.display = "inline-block";
        previewImg.style.display = "none";
        openCamBtn.style.display = "none";
      } catch (err) {
        Swal.fire("Error", "Cannot access camera: " + err.message, "error");
      }
    });


    captureBtn.addEventListener("click", () => {
      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      canvas.toBlob(
        (blob) => {
          const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
          fileInput.fileFromCamera = file;
          fileInput.value = "";

          previewImg.src = URL.createObjectURL(blob);
          previewImg.style.display = "block";

          Swal.fire("Info", "Photo captured! Ready to submit.", "info");
        },
        "image/jpeg",
        0.9
      );

      this.stopCamera();
      video.style.display = "none";
      captureBtn.style.display = "none";
      openCamBtn.style.display = "inline-block";
    });

    form.addEventListener("reset", () => {
      this.stopCamera();
      video.style.display = "none";
      captureBtn.style.display = "none";
      openCamBtn.style.display = "inline-block";
      previewImg.style.display = "none";
    });
  }

  destroy() {
    this.stopCamera();

    document.removeEventListener("visibilitychange", this.handleVisibility);
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
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
