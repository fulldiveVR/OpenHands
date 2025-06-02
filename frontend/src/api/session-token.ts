
export function getCookie(): any {
  const trimmedCookie: any = {};
  document.cookie.split(";").forEach(item => {
    const [key, value] = item.split("=");
    trimmedCookie[key.trim()] = value;
  });
  return trimmedCookie;
}

export function getSessionToken(): string | null {
  const cookie: any = getCookie();

  if (cookie && cookie.rf) {
    return cookie.rf;
  } else {
    return null;
  }
}

export function deleteCookies() {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    if (name.includes("rf")) {
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" + document.domain;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=." + document.domain; // For subdomains
    }
  }
  localStorage?.clear();
}
