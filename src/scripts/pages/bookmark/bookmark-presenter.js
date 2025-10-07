export default class BookmarkPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async init() {
    this.#view.showLoading();

    try {
      const stories = await this.#model.getAllStories();

      if (!stories || stories.length === 0) {
        this.#view.showEmptyMessage();
      } else {
        this.#view.renderStories(stories);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      this.#view.showError(error.message);
    } finally {
      this.#view.hideLoading();
    }
  }
}
