import type { EditNoteRequest, Note } from "./types";

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export async function authFetch(
  url: string,
  method: string,
  authToken: string,
  body?: string,
) {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  };

  if (body) {
    options.body = body;
  }

  return fetch(url, options);
}

export async function fetchNotes(token: string) {
  return authFetch(`${BASE_URL}/api/auth/notes`, "GET", token);
}

export async function fetchPublicNote(publicId: string) {
  return fetch(`${BASE_URL}/api/public/notes/${encodeURIComponent(publicId)}`);
}

export async function createNoteRequest(
  token: string,
  note: Omit<EditNoteRequest, "id">,
) {
  return authFetch(
    `${BASE_URL}/api/auth/notes`,
    "POST",
    token,
    JSON.stringify(note),
  );
}

export async function updateNoteRequest(token: string, note: EditNoteRequest) {
  return authFetch(
    `${BASE_URL}/api/auth/notes/${encodeURIComponent(note.id)}`,
    "PATCH",
    token,
    JSON.stringify({ ...note }),
  );
}

export async function deleteNoteRequest(token: string, noteId: string) {
  return authFetch(
    `${BASE_URL}/api/auth/notes/${encodeURIComponent(noteId)}`,
    "DELETE",
    token,
  );
}

export async function restoreNoteRequest(token: string, noteId: string) {
  return authFetch(
    `${BASE_URL}/api/auth/notes/${encodeURIComponent(noteId)}/restore`,
    "POST",
    token,
  );
}

export async function permanentlyDeleteNoteRequest(token: string, noteId: string) {
  return authFetch(
    `${BASE_URL}/api/auth/notes/${encodeURIComponent(noteId)}/permanent`,
    "DELETE",
    token,
  );
}

export async function fetchNoteRequest(token: string, noteId: string) {
  return authFetch(
    `${BASE_URL}/api/auth/notes/${encodeURIComponent(noteId)}`,
    "GET",
    token,
  );
}

export async function shareNoteRequest(token: string, noteId: string) {
  return authFetch(
    `${BASE_URL}/api/auth/notes/${encodeURIComponent(noteId)}/share`,
    "POST",
    token,
  );
}

export async function unshareNoteRequest(token: string, noteId: string) {
  return authFetch(
    `${BASE_URL}/api/auth/notes/${encodeURIComponent(noteId)}/share`,
    "DELETE",
    token,
  );
}

export async function importNotesRequest(token: string, notes: Note[]) {
  return authFetch(
    `${BASE_URL}/api/auth/notes/import`,
    "POST",
    token,
    JSON.stringify({ notes }),
  );
}
