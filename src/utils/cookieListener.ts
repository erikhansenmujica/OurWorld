export function listenCookieChange(
  callback: (url: string) => void,
  interval = 1000
) {
  let lastCookie = document.cookie;
  setInterval(() => {
    let cookie = document.cookie;
    if (cookie !== lastCookie) {
      if (!cookie) {
        return callback("/login");
      }
      callback("/");
      lastCookie = cookie;
    }
  }, interval);
}
