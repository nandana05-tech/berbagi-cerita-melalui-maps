import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import { getAccessToken, getLogout } from "../utils/auth";
import {
  IsLoginNavigationListTemplateandUnsubscribed,
  IsLoginNavigationListTemplateandSubscribed,
  NotLoginNavigationListTemplate,
} from "../templates";
import { isServiceWorkerAvailable, checkIfSubscribed } from "../utils";
import { subscribe, unsubscribe } from "../utils/notification-helper";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
    this._renderNavigation();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener("click", () => {
      this.#navigationDrawer.classList.toggle("open");
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
        }
      });
    });
  }

  async _renderNavigation() {
    const isLogin = !!getAccessToken();
    const navList = this.#navigationDrawer.querySelector("ul");

    if (!isLogin) {
      navList.innerHTML = NotLoginNavigationListTemplate();
      return;
    }

    console.log("User is subscribed:", await checkIfSubscribed());

    const isSubscribed = await checkIfSubscribed();

    if (isSubscribed === true) {
      navList.innerHTML = IsLoginNavigationListTemplateandSubscribed();

      document
        .getElementById("unsubscribe-button")
        .addEventListener("click", async () => {
          await unsubscribe();
          await this._renderNavigation();
        });
    } else {
      navList.innerHTML = IsLoginNavigationListTemplateandUnsubscribed();

      document
        .getElementById("subscribe-button")
        .addEventListener("click", async () => {
          await subscribe();
          await this._renderNavigation();
        });
    }
    this.#setupLogoutButton();
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];

    if (!page) {
      if (!sessionStorage.getItem("hasRefreshed")) {
        sessionStorage.setItem("hasRefreshed", "true");
        location.reload();
        return;
      }

      this.#content.innerHTML = "<h2>Page not found</h2>";
      sessionStorage.removeItem("hasRefreshed");
      return;
    }

    if (this.currentPage && typeof this.currentPage.destroy === "function") {
      this.currentPage.destroy();
    }

    this.#content.innerHTML = await page.render();
    await page.afterRender();

    this.currentPage = page;

    this._renderNavigation();
  }

  #setupLogoutButton() {
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", (event) => {
      event.preventDefault();

      if (confirm("Apakah Anda yakin ingin keluar?")) {
        getLogout();
        location.hash = "/login";
        this._renderNavigation();
      }
    });
  }
}
}

export default App;
