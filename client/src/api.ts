import type { Note } from "./note";

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
  return authFetch("http://localhost:3000/api/auth/notes", "GET", token!);
}

export async function createNoteRequest(
  token: string,
  subject: string,
  body: string,
) {
  return authFetch(
    "http://localhost:3000/api/auth/notes",
    "POST",
    token!,
    JSON.stringify({
      subject,
      body,
    }),
  );
}

export async function updateNoteRequest(token: string, note: Note) {
  return authFetch(
    `http://localhost:3000/api/auth/notes/${encodeURIComponent(note.id)}`,
    "PATCH",
    token!,
    JSON.stringify({...note}),
  );
}

export async function deleteNoteRequest(token: string, noteId: string) {
    return authFetch(
      `http://localhost:3000/api/auth/notes/${encodeURIComponent(noteId)}`,
      "DELETE",
      token!,
    );
}