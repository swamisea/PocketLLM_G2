import { User } from "@common/types/account";

const USER_COOKIE = "pll_user";
const TOKEN_COOKIE = "pll_token";
function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp("(^|; )" + name.replace(/([$?*|{}\[\\\]/+^])/g, "\\$1") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
}

export function setUserCookie(user: User, token: string) {
  setCookie(USER_COOKIE, JSON.stringify(user));
  setCookie(TOKEN_COOKIE, token);
}

export function getUserFromCookie(): User | null {
  if (typeof document === "undefined") return null;
  const raw = getCookie(USER_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  return getCookie(TOKEN_COOKIE);
}

export function clearUserCookie() {
  deleteCookie(USER_COOKIE);
  deleteCookie(TOKEN_COOKIE);
}
