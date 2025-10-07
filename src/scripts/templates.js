export function IsLoginNavigationListTemplateandUnsubscribed() {
  return `
    <li class="navigation-list__item"><a href="#/">Beranda</a></li>
    <li class="navigation-list__item"><a href="#/add-story">Add Story</a></li>
    <li class="navigation-list__item"><a href="#/bookmark">Bookmark</a></li>
    <li class="navigation-list__item">
      <button id="subscribe-button" class="btn subscribe-button">
        Subscribe <i class="fas fa-bell"></i>
      </button>
    </li>
    <li class="navigation-list__item">
      <a id="logout-button" class="logout-button" href="#/logout">
        <i class="fas fa-sign-out-alt"></i> Logout
      </a>
    </li>
  `;
}

export function IsLoginNavigationListTemplateandSubscribed() {
  return `
    <li class="navigation-list__item"><a href="#/">Beranda</a></li>
    <li class="navigation-list__item"><a href="#/add-story">Add Story</a></li>
    <li class="navigation-list__item"><a href="#/bookmark">Bookmark</a></li>
    <li class="navigation-list__item">
      <button id="unsubscribe-button" class="btn unsubscribe-button">
        Unsubscribe <i class="fas fa-bell-slash"></i>
      </button>
    </li>
    <li class="navigation-list__item">
      <a id="logout-button" class="logout-button" href="#/logout">
        <i class="fas fa-sign-out-alt"></i> Logout
      </a>
    </li>
  `;
}

export function NotLoginNavigationListTemplate() {
  return `
    <li class="navigation-list__item"><a href="#/login">Masuk</a></li>
    <li class="navigation-list__item"><a href="#/register">Daftar</a></li>
  `;
}
