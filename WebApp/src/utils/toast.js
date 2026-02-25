/**
 * Global toast service - can be used from anywhere (including axios).
 * Subscribers (e.g. App.vue) display the messages.
 */
let subscribers = [];

export const toast = {
  success(message) {
    if (message) {
      subscribers.forEach((fn) => fn({ type: 'success', message }));
    }
  },
  error(message) {
    if (message) {
      subscribers.forEach((fn) => fn({ type: 'error', message }));
    }
  },
  subscribe(fn) {
    subscribers.push(fn);
    return () => {
      subscribers = subscribers.filter((f) => f !== fn);
    };
  }
};
