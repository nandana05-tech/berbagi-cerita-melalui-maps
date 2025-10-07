import { convertBase64ToUint8Array } from "./index";
import CONFIG from "../config";
import { subscribePushNotification, unsubscribePushNotification  } from "../data/api";
import { registerServiceWorker } from '../utils';

export function isNotificationAvailable() {
  return "Notification" in window;
}
export function isNotificationGranted() {
  return Notification.permission === "granted";
}
export async function requestNotificationPermission() {
  if (!isNotificationAvailable()) {
    console.error("Notification API unsupported.");
    return false;
  }
  if (isNotificationGranted()) {
    return true;
  }
  const status = await Notification.requestPermission();
  if (status === "denied") {
    alert("Izin notifikasi ditolak.");
    return false;
  }
  if (status === "default") {
    alert("Izin notifikasi ditutup atau diabaikan.");
    return false;
  }
  return true;
}

export async function getPushSubscription() {
  try {
    await registerServiceWorker();
    const readyRegistration = await navigator.serviceWorker.ready;

    const registration = (await navigator.serviceWorker.getRegistration()) || readyRegistration;
    if (!registration?.pushManager) {
      console.warn("PushManager tidak tersedia di registration.");
      return null;
    }

    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error("getPushSubscription: gagal mendapatkan subscription:", error);
    return null;
  }
}

export async function isCurrentPushSubscriptionAvailable() {
  return !!(await getPushSubscription());
}
export function generateSubscribeOptions() {
  return {
    userVisibleOnly: true,
    applicationServerKey: convertBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
  };
}

export async function subscribe() {
  if (!(await requestNotificationPermission())) {
    return;
  }

  if (await isCurrentPushSubscriptionAvailable()) {
    alert("Sudah berlangganan push notification.");
    return;
  }

  console.log("Mulai berlangganan push notification...");

  const failureSubscribeMessage = "Langganan push notification gagal diaktifkan.";
  const successSubscribeMessage = "Langganan push notification berhasil diaktifkan.";

  let pushSubscription;

  try {
    await registerServiceWorker();
    const readyRegistration = await navigator.serviceWorker.ready;

    let registration = (await navigator.serviceWorker.getRegistration()) || readyRegistration;

    if (!registration?.pushManager) {
      throw new Error("PushManager tidak tersedia di registration");
    }

    pushSubscription = await registration.pushManager.subscribe(generateSubscribeOptions());
    const { endpoint, keys } = pushSubscription.toJSON();

    const response = await subscribePushNotification({ endpoint, keys });
    console.log({ endpoint, keys, response });

    if (!response.ok) {
      console.error("subscribe: response:", response);
      alert(failureSubscribeMessage);
      await pushSubscription.unsubscribe();
      return;
    }

    alert(successSubscribeMessage);
  } catch (error) {
    console.error("subscribe: error:", error);
    alert(failureSubscribeMessage);
    if (pushSubscription) await pushSubscription.unsubscribe();
  }
}


export async function unsubscribe() {
  const failureUnsubscribeMessage = 'Langganan push notification gagal dinonaktifkan.';
  const successUnsubscribeMessage = 'Langganan push notification berhasil dinonaktifkan.';
  try {
    const pushSubscription = await getPushSubscription();
    if (!pushSubscription) {
      alert('Tidak bisa memutus langganan push notification karena belum berlangganan sebelumnya.');
      return;
    }
    const { endpoint, keys } = pushSubscription.toJSON();
    const response = await unsubscribePushNotification({ endpoint });
    console.log({ endpoint, keys, response });
    if (!response.ok) {
      alert(failureUnsubscribeMessage);
      console.error('unsubscribe: response:', response);
      return;
    }
    const unsubscribed = await pushSubscription.unsubscribe();
    if (!unsubscribed) {
      alert(failureUnsubscribeMessage);
      await subscribePushNotification({ endpoint, keys });
      return;
    }
    alert(successUnsubscribeMessage);
  } catch (error) {
    alert(failureUnsubscribeMessage);
    console.error('unsubscribe: error:', error);
  }
}