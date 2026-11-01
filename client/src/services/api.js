// client/src/services/api.js
// Everything the website says to the backend goes through this file.

import axios from "axios";

const api = axios.create({
  // Set in client/.env (local) or in Vercel (production). Never hardcode it here.
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 300000, // 5 minutes: AI generation can be slow on busy days
  headers: { "Content-Type": "application/json" },
});

// Turn every failure into one simple Error with a readable message and a code.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = error.response?.data?.error;
    let message;
    let code;

    if (apiError) {
      message = apiError.message;
      code = apiError.code;
    } else if (error.code === "ECONNABORTED") {
      message = "The server took too long to answer. Please try again.";
      code = "TIMEOUT";
    } else if (error.response) {
      message = `The server sent an unexpected answer (${error.response.status}).`;
      code = "HTTP_ERROR";
    } else {
      message =
        "Cannot reach the game server. Check your internet connection. If you just opened the site, the server may be waking up, so wait a moment and try again.";
      code = "NETWORK_ERROR";
    }

    const friendly = new Error(message);
    friendly.code = code;
    friendly.status = error.response?.status;
    return Promise.reject(friendly);
  }
);

// The backend always answers { success, data }. We only need "data".
const unwrap = (response) => response.data.data;
const enc = encodeURIComponent;

export const createCase = (premise, difficulty) =>
  api.post("/cases", { premise, difficulty }).then(unwrap);

export const getCase = (id) => api.get(`/cases/${enc(id)}`).then(unwrap);

export const discoverClue = (id, clueId) =>
  api.post(`/cases/${enc(id)}/clues/${enc(clueId)}/discover`).then(unwrap);

export const requestHint = (id) => api.post(`/cases/${enc(id)}/hints`).then(unwrap);

export const accuseSuspect = (id, suspectId, explanation) =>
  api.post(`/cases/${enc(id)}/accuse`, { suspectId, explanation }).then(unwrap);

export const getResult = (id) => api.get(`/cases/${enc(id)}/result`).then(unwrap);

// ---------- Remember the current case in this browser ----------
// Only the case ID is stored (never any solution), so a refresh does not lose progress.

const STORAGE_KEY = "ai-mystery-room:current-case";

export function saveCurrentCase(id) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* storage may be blocked; the game still works */
  }
}

export function getCurrentCase() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearCurrentCase() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}