type Listener = (loading: boolean) => void;

let listeners: Listener[] = [];
let loading = false;

export function subscribeLoading(listener: Listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notify() {
  listeners.forEach((listener) => listener(loading));
}

export function startGlobalLoading() {
  loading = true;
  notify();
}

export function stopGlobalLoading() {
  loading = false;
  notify();
}
