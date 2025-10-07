import { getAccessToken } from "../utils/auth";
import CONFIG from "../config";

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
  UNSUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`, 
};

export async function getRegistered({ name, email, password }) {
  const data = JSON.stringify({ name, email, password });

  const fetchResponse = await fetch(ENDPOINTS.REGISTER, {
    method: "POST",
    headers: { "Content-type": "application/json" },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function getLogin({ email, password }) {
  const data = JSON.stringify({ email, password });

  const fetchResponse = await fetch(ENDPOINTS.LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function getStories({ location = 1, page = 1, size = 10 }) {
  const fetchResponse = await fetch(
    `${CONFIG.BASE_URL}/stories?location=${location}&page=${page}&size=${size}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    }
  );
  const json = await fetchResponse.json();
  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function getStoryById(id) {
  const fetchResponse = await fetch(`${CONFIG.BASE_URL}/stories/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });
  const json = await fetchResponse.json();
  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function addStory({ description, photo, lat, lon }) {
  const formData = new FormData();
  formData.append("description", description);
  formData.append("photo", photo);
  if (lat && lon) {
    formData.append("lat", lat);
    formData.append("lon", lon);
  }

  const fetchResponse = await fetch(`${CONFIG.BASE_URL}/stories`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${getAccessToken()}`,
    },
    body: formData,
  });

  const json = await fetchResponse.json();
  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function subscribePushNotification({ endpoint, keys: { p256dh, auth } }) {
  const accessToken = getAccessToken();

  try {
    const response = await fetch(ENDPOINTS.SUBSCRIBE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        endpoint,
        keys: { p256dh, auth },
      }),
    });

    const result = await response.json();

    return {
      ok: response.ok,
      ...result,
    };
  } catch (error) {
    console.error("Error subscribing push notification:", error);
    return {
      ok: false,
      error: true,
      message: error.message,
    };
  }
}

export async function unsubscribePushNotification({ endpoint }) {
  const accessToken = getAccessToken();

  try {
    const response = await fetch(ENDPOINTS.UNSUBSCRIBE, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ endpoint }),
    });

    const result = await response.json();

    return {
      ok: response.ok,
      ...result,
    };
  } catch (error) {
    console.error("Error unsubscribing push notification:", error);
    return {
      ok: false,
      error: true,
      message: error.message,
    };
  }
}