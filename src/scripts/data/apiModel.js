import { getAccessToken } from "../utils/auth";

const API_BASE_URL = "https://story-api.dicoding.dev/v1";
const VAPID_PUBLIC_KEY = "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";

export const ApiModel = {
  async subscribeToPushNotification(subscription) {
    const token = getAccessToken();

    const response = await fetch(`${API_BASE_URL}/notifications/subscribe`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    });

    return response.json();
  },

  async unsubscribeFromPushNotification(subscription) {
    const token = getAccessToken();

    const response = await fetch(`${API_BASE_URL}/notifications/subscribe`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    return response.json();
  },
};
