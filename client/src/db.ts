import type { Note } from "./types";

const NOTES_STORAGE_KEY = "notes-app.notes";

function sortNotes(notes: Note[]) {
  return [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function loadNotes(): Note[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedNotes = window.localStorage.getItem(NOTES_STORAGE_KEY);

  if (!storedNotes) {
    return [];
  }

  try {
    const parsedNotes = JSON.parse(storedNotes);

    if (!Array.isArray(parsedNotes)) {
      return [];
    }

    return sortNotes(
      parsedNotes.filter(
        (note): note is Note =>
          typeof note?.id === "string" &&
          typeof note?.subject === "string" &&
          typeof note?.body === "string" &&
          typeof note?.createdAt === "string" &&
          typeof note?.updatedAt === "string",
      ),
    );
  } catch {
    return [];
  }
}

export function saveNotes(notes: Note[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(sortNotes(notes)));
}

export function createStoredNote(subject: string, body: string): Note {
  const timestamp = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    subject,
    body,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
