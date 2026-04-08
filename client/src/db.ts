import type { Note } from "./types";

const NOTES_STORAGE_KEY = "notes-app.notes";

function sortNotes(notes: Note[]) {
  return [...notes].sort(
    (a, b) => {
      if (a.pinned !== b.pinned) {
        return Number(b.pinned) - Number(a.pinned);
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    },
  );
}

function normalizeNote(note: unknown): Note | null {
  const candidate = note as Record<string, unknown>;

  if (
    typeof note !== "object" ||
    note === null ||
    typeof candidate.id !== "string" ||
    typeof candidate.subject !== "string" ||
    typeof candidate.body !== "string" ||
    typeof candidate.createdAt !== "string" ||
    typeof candidate.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    subject: candidate.subject,
    body: candidate.body,
    tags: Array.isArray(candidate.tags)
      ? candidate.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    folder: typeof candidate.folder === "string" ? candidate.folder : "",
    pinned: typeof candidate.pinned === "boolean" ? candidate.pinned : false,
    isPublic:
      typeof candidate.isPublic === "boolean" ? candidate.isPublic : false,
    publicId:
      typeof candidate.publicId === "string" ? candidate.publicId : null,
    deletedAt:
      typeof candidate.deletedAt === "string" ? candidate.deletedAt : null,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
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
      parsedNotes.map(normalizeNote).filter((note): note is Note => note !== null),
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

export function createStoredNote(
  subject: string,
  body: string,
  options?: Pick<Note, "tags" | "folder" | "pinned">,
): Note {
  const timestamp = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    subject,
    body,
    tags: options?.tags ?? [],
    folder: options?.folder ?? "",
    pinned: options?.pinned ?? false,
    isPublic: false,
    publicId: null,
    deletedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function clearStoredNotes() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(NOTES_STORAGE_KEY);
}
