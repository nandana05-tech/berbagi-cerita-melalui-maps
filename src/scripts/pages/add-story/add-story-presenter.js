import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Swal from "sweetalert2";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { checkIfSubscribed } from "../../utils";

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export default class AddStoryPresenter {
  #model;
  #view;
  #map;
  #marker;

  constructor({ model, view }) {
    this.#model = model;
    this.#view = view;
  }

  async init() {
    this.#map = L.map("map").setView([-2.548926, 118.0148634], 5);

    const osm = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "&copy; OpenStreetMap contributors" }
    );

    const topo = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      {
        attribution:
          "Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap",
      }
    );

    osm.addTo(this.#map);
    L.control.layers({ OSM: osm, Topo: topo }, {}).addTo(this.#map);

    this.#map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      this.#addMarker(lat, lng);

      document.getElementById("lat").value = lat;
      document.getElementById("lon").value = lng;
    });

    this.#setupFormSubmit();
    await this.#loadStories();
  }

  async #loadStories() {
    const response = await this.#model.getStories({ location: 1 });

    if (response.error) {
      this.#view.showError("Gagal memuat cerita.");
      return;
    }

    this.#view.renderStories(response.listStory);
  }

  #addMarker(lat, lon) {
    if (this.#marker) {
      this.#map.removeLayer(this.#marker);
    }
    this.#marker = L.marker([lat, lon], { draggable: false }).addTo(this.#map);
  }

  #setupFormSubmit() {
    const form = document.getElementById("story-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const desc = document.getElementById("desc").value.trim();
      let photo = document.getElementById("photo").files[0];
      if (!photo && document.getElementById("photo").fileFromCamera) {
        photo = document.getElementById("photo").fileFromCamera;
      }
      const lat = parseFloat(document.getElementById("lat").value);
      const lon = parseFloat(document.getElementById("lon").value);

      if (!desc) {
        Swal.fire("Error", "Description is required", "error");
        return;
      }
      if (!photo) {
        Swal.fire("Error", "Photo is required (upload or camera)", "error");
        return;
      }
      if (photo.size > 1024 * 1024) {
        Swal.fire("Error", "Photo must be < 1 MB", "error");
        return;
      }
      if (!lat || !lon) {
        Swal.fire("Error", "Click on the map to set location", "error");
        return;
      }

      await this.#submitForm(desc, photo, lat, lon);
      form.reset();
      document.getElementById("preview").style.display = "none";

      if (this.#marker) {
        this.#map.removeLayer(this.#marker);
        this.#marker = null;
      }

      document.getElementById("lat").value = "";
      document.getElementById("lon").value = "";

      await this.#notifyToAllUser(desc, photo);
    });
  }

  async #submitForm(description, photo, lat, lon) {
    const response = await this.#model.addStory({
      description,
      photo,
      lat,
      lon,
    });

    if (response.ok) {
      await Swal.fire("Success!", response.message, "success");
      await this.#loadStories();
    } else {
      await Swal.fire(
        "Error",
        response.message || "Failed to add story",
        "error"
      );
    }
  }

  async #notifyToAllUser(description, photo) {
    try {
      const story = { description, photoUrl: URL.createObjectURL(photo) };
      if (!story) {
        console.error("#notifyToAllUser: story not found");
        return false;
      }

      const isSubscribed = await checkIfSubscribed();

      if (Notification.permission === "granted" && isSubscribed === true) {
        new Notification("Story baru!", {
          body: `Ada story baru: ${story.description}`,
          icon: story.photoUrl,
        });
      } else if (Notification.permission === "denied" || isSubscribed === false) {
        console.log("#notifyToAllUser: belum aktif.");
      }

      return true;
    } catch (error) {
      console.error("#notifyToAllUser: error:", error);
      return false;
    }
  }
}
