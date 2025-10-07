export default class HomePresenter {
  #model;
  #view;

  constructor({ model, view }) {
    this.#model = model;
    this.#view = view;
  }

  async init() {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        this.#view.renderMap(latitude, longitude);
        await this.#loadStories();
      },
      async (err) => {
        console.error("Geolocation error:", err);
        this.#view.renderMap(-2.548926, 118.0148634);
        await this.#loadStories();
      }
    );
  }

  async #loadStories() {
    try {
      const response = await this.#model.getStories({ location: 1 });

      if (!response.ok) {
        console.error("Failed to fetch stories:", response.message);
        this.#view.renderStories([]);
        return;
      }

      this.#view.renderStories(response.listStory);

      response.listStory.forEach((story) => {
        this.#view.addMarker(story);
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      this.#view.renderStories([]);
    }
  }
}
