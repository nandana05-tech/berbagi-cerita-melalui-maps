import BookmarkPresenter from './bookmark-presenter';
import Database from '../../data/database';
import Swal from 'sweetalert2';

export default class BookmarkPage {
  #presenter;

  async render() {
    return `
      <section class="container">
        <h1 class="section-title">Cerita yang Disimpan</h1>
        <div id="loading-container" class="loading"></div>
        <div id="bookmark-list"></div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new BookmarkPresenter({
      view: this,
      model: Database,
    });

    await this.#presenter.init();
  }

  showLoading() {
    document.getElementById('loading-container').innerHTML = `
      <p>Sedang memuat cerita tersimpan...</p>
    `;
  }

  hideLoading() {
    document.getElementById('loading-container').innerHTML = '';
  }

  showEmptyMessage() {
    document.getElementById('bookmark-list').innerHTML = `
      <p>Tidak ada cerita tersimpan.</p>
    `;
  }

  showError(message) {
    document.getElementById('bookmark-list').innerHTML = `
      <p>Terjadi kesalahan: ${message}</p>
    `;
  }

  renderStories(stories) {
    const listContainer = document.getElementById('bookmark-list');
    listContainer.innerHTML = '';

    stories.forEach((story) => {
      const item = document.createElement('article');
      item.className = 'story-card';
      item.innerHTML = `
        <img src="${story.photoUrl}" alt="Foto oleh ${story.name}" class="story-thumbnail" />
        <div class="story-body">
          <h3>${story.name}</h3>
          <p>${story.description}</p>
          <time datetime="${story.createdAt}">
            ${new Date(story.createdAt).toLocaleString()}
          </time>
          <button class="delete-btn">Hapus Bookmark</button>
        </div>
      `;

      item.querySelector('.delete-btn').addEventListener('click', async () => {
        await Database.deleteStory(story.id);
        item.remove();
        Swal.fire({
          icon: 'success',
          title: 'Dihapus',
          text: 'Cerita telah dihapus dari bookmark.',
          timer: 1500,
          showConfirmButton: false
        });
      });

      listContainer.appendChild(item);
    });
  }
}
