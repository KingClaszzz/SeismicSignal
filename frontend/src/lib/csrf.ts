import axios from "axios";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/api";

let csrfTokenPromise: Promise<string | null> | null = null;
let currentCsrfToken: string | null = null;

function setAxiosCsrfToken(token: string | null) {
  currentCsrfToken = token;

  if (token) {
    axios.defaults.headers.common["x-csrf-token"] = token;
  } else {
    delete axios.defaults.headers.common["x-csrf-token"];
  }
}

export function updateCsrfToken(token: string | null) {
  setAxiosCsrfToken(token);
}

export async function ensureCsrfToken() {
  if (currentCsrfToken) {
    return currentCsrfToken;
  }

  if (!csrfTokenPromise) {
    csrfTokenPromise = axios
      .get(`${API_URL}/auth/csrf`, { withCredentials: true })
      .then((res) => {
        const token = res.data?.data?.csrfToken;
        if (typeof token === "string" && token.length >= 32) {
          setAxiosCsrfToken(token);
          return token;
        }

        return null;
      })
      .finally(() => {
        csrfTokenPromise = null;
      });
  }

  return csrfTokenPromise;
}
