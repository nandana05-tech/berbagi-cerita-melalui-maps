
export function isServiceWorkerAvailable() {
  return 'serviceWorker' in navigator;
}
 
export async function registerServiceWorker() {
  if (!isServiceWorkerAvailable()) {
    console.log('Service Worker API unsupported');
    return;
  }
 
  try {
    const registration = await navigator.serviceWorker.register('./sw.bundle.js');
    console.log('Service worker telah terpasang', registration);
  } catch (error) {
    console.log('Failed to install service worker:', error);
  }
}

export function convertBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function checkIfSubscribed() {
  try {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker tidak didukung di browser ini.");
      return false;
    }

    const readyRegistration = await navigator.serviceWorker.ready;

    const registration = (await navigator.serviceWorker.getRegistration()) || readyRegistration;
    if (!registration?.pushManager) return false;

    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error("checkIfSubscribed: gagal memeriksa status:", error);
    return false;
  }
}