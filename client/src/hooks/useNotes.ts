import { useEffect, useCallback, useState } from "react";
import { createEmptyNote, type Note } from "../types";
import { NoteForm } from "../schemas";
import { z } from "zod";
import { useNavigate } from "react-router";
import { clearStoredNotes, createStoredNote, loadNotes, saveNotes } from "../db";
import { useOptionalAuth } from "../auth-context";
import {
  createNoteRequest,
  deleteNoteRequest,
  fetchNoteRequest,
  fetchNotes,
  importNotesRequest,
  permanentlyDeleteNoteRequest,
  restoreNoteRequest,
  shareNoteRequest,
  unshareNoteRequest,
  updateNoteRequest,
} from "../api";

export const useNotes = () => {
  const { accountsAvailable, getToken, isReady, isSignedIn } = useOptionalAuth();
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [currentNote, setCurrentNote] = useState<Note>(createEmptyNote());
  const [notes, setNotes] = useState<Note[]>([]);
  const [errors, setErrors] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [disableButtons, setDisableButtons] = useState(false);
  const [isFetchingNote, setFetchingNote] = useState(false);
  const [localImportCount, setLocalImportCount] = useState(0);

  const navigate = useNavigate();
  const storageMode: "local" | "account" = isSignedIn ? "account" : "local";

  const refreshLocalImportCount = useCallback(() => {
    setLocalImportCount(loadNotes().length);
  }, []);

  const loadAccountNotes = useCallback(async () => {
    const token = await getToken();

    if (!token) {
      setLoadingMessage("Failed to fetch account notes");
      return;
    }

    const res = await fetchNotes(token);

    if (!res.ok) {
      setLoadingMessage("Failed to fetch account notes");
      return;
    }

    const json = await res.json();
    setNotes(json?.rows ?? []);
    setLoadingMessage("");
  }, [getToken]);

  useEffect(() => {
    refreshLocalImportCount();
  }, [refreshLocalImportCount]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStatusMessage("");
    }, 3500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [statusMessage]);

  useEffect(() => {
    if (accountsAvailable && !isReady) {
      setLoadingMessage("Loading...");
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      if (!isSignedIn) {
        if (!cancelled) {
          setNotes(loadNotes());
          setLoadingMessage("");
        }
        return;
      }

      try {
        if (!cancelled) {
          await loadAccountNotes();
        }
      } catch {
        if (!cancelled) {
          setLoadingMessage("Failed to fetch account notes");
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [accountsAvailable, isReady, isSignedIn, loadAccountNotes]);

  const fetchNoteById = useCallback(async (noteId: string) => {
    try {
      setFetchingNote(true);

      if (!isSignedIn) {
        const note = loadNotes().find((storedNote) => storedNote.id === noteId);

        if (note) {
          setCurrentNote(note);
          setStatusMessage("");
        } else {
          setErrors(`Couldn't find note with ID ${noteId}`);
          navigate("/");
        }

        return;
      }

      const token = await getToken();

      if (!token) {
        setErrors("You need to be signed in to access account notes");
        navigate("/");
        return;
      }

      const result = await fetchNoteRequest(token, noteId);

      if (result.ok) {
        const json = await result.json();
        setCurrentNote(json);
        setStatusMessage("");
      } else {
        setErrors(`Couldn't find note with ID ${noteId}`);
        navigate("/");
      }
    }
    catch {
      setErrors(`Encountered error while finding note with ID ${noteId}`);
      navigate("/");
    }
    finally {
      setFetchingNote(false);
    }
  }, [getToken, isSignedIn, navigate]);

  async function deleteNote(noteId: string) {
    try {
      setDisableButtons(true);

      if (!isSignedIn) {
        const nextNotes = notes.map((note) =>
          note.id === noteId
            ? {
                ...note,
                deletedAt: new Date().toISOString(),
                isPublic: false,
                updatedAt: new Date().toISOString(),
              }
            : note,
        );

        saveNotes(nextNotes);
        setNotes(nextNotes);
        setErrors("");
        setStatusMessage("Note moved to trash");
        refreshLocalImportCount();
        return;
      }

      const token = await getToken();

      if (!token) {
        setErrors("You need to be signed in to delete account notes");
        return;
      }

      const result = await deleteNoteRequest(token, noteId);

      if (result.ok) {
        setNotes((currentNotes) =>
          currentNotes.map((note) =>
            note.id === noteId
              ? {
                  ...note,
                  deletedAt: new Date().toISOString(),
                  isPublic: false,
                }
              : note,
          ),
        );
        setErrors("");
        setStatusMessage("Note moved to trash");
      } else {
        const json = await result.json();
        setErrors(json?.message ?? "Failed to delete note");
      }
    } catch {
      setErrors(
        isSignedIn ? "Failed to delete account note" : "Failed to delete note",
      );
    }
    finally {
      setDisableButtons(false);
    }
  }

  async function restoreNote(noteId: string) {
    try {
      setDisableButtons(true);

      if (!isSignedIn) {
        const nextNotes = notes.map((note) =>
          note.id === noteId ? { ...note, deletedAt: null } : note,
        );

        saveNotes(nextNotes);
        setNotes(nextNotes);
        setErrors("");
        setStatusMessage("Note restored");
        refreshLocalImportCount();
        return;
      }

      const token = await getToken();

      if (!token) {
        setErrors("You need to be signed in to restore notes");
        return;
      }

      const result = await restoreNoteRequest(token, noteId);
      const json = await result.json();

      if (!result.ok) {
        setErrors(json?.message ?? "Failed to restore note");
        return;
      }

      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === noteId
            ? { ...note, deletedAt: json.deletedAt, updatedAt: json.updatedAt }
            : note,
        ),
      );
      setErrors("");
      setStatusMessage("Note restored");
    } catch {
      setErrors(isSignedIn ? "Failed to restore account note" : "Failed to restore note");
    } finally {
      setDisableButtons(false);
    }
  }

  async function permanentlyDeleteNote(noteId: string) {
    try {
      setDisableButtons(true);

      if (!isSignedIn) {
        const nextNotes = notes.filter((note) => note.id !== noteId);

        saveNotes(nextNotes);
        setNotes(nextNotes);
        setErrors("");
        setStatusMessage("Note permanently deleted");
        refreshLocalImportCount();
        return;
      }

      const token = await getToken();

      if (!token) {
        setErrors("You need to be signed in to permanently delete notes");
        return;
      }

      const result = await permanentlyDeleteNoteRequest(token, noteId);

      if (!result.ok) {
        const json = await result.json();
        setErrors(json?.message ?? "Failed to permanently delete note");
        return;
      }

      setNotes((currentNotes) =>
        currentNotes.filter((note) => note.id !== noteId),
      );
      setErrors("");
      setStatusMessage("Note permanently deleted");
    } catch {
      setErrors(
        isSignedIn
          ? "Failed to permanently delete account note"
          : "Failed to permanently delete note",
      );
    } finally {
      setDisableButtons(false);
    }
  }

  async function createNote() {
    const parsedNote = NoteForm.safeParse(currentNote);

    if (!parsedNote.success) {
      setErrors(z.prettifyError(parsedNote.error));
      return;
    }

    setSubmitDisabled(true);

    try {
      if (!isSignedIn) {
        const newNote = createStoredNote(
          parsedNote.data.subject,
          parsedNote.data.body,
          {
            tags: parsedNote.data.tags,
            folder: parsedNote.data.folder,
            pinned: parsedNote.data.pinned,
          },
        );
        const nextNotes = [newNote, ...notes];

        saveNotes(nextNotes);

        resetCurrentNote();
        navigate("/");
        setErrors("");
        setStatusMessage("Note created");
        setNotes(nextNotes);
        refreshLocalImportCount();
        return;
      }

      const token = await getToken();

      if (!token) {
        setErrors("You need to be signed in to create account notes");
        return;
      }

        const result = await createNoteRequest(
          token,
          parsedNote.data,
        );
        const json = await result.json();

      if (!result.ok) {
        setErrors(json?.message ?? "Failed to create note");
        return;
      }

      const nextNote = {
        id: json.noteId,
        subject: parsedNote.data.subject,
        body: parsedNote.data.body,
        tags: parsedNote.data.tags,
        folder: parsedNote.data.folder,
        pinned: parsedNote.data.pinned,
        isPublic: false,
        publicId: null,
        deletedAt: null,
        createdAt: json.createdAt,
        updatedAt: json.updatedAt,
      };

      resetCurrentNote();
      navigate("/");
      setErrors("");
      setStatusMessage("Note created");
      setNotes((currentNotes) => [nextNote, ...currentNotes]);
    } catch {
      setErrors(
        isSignedIn ? "Failed to create account note" : "Failed to create note",
      );
    }
    finally {
      setSubmitDisabled(false);
    }
  }

  async function editNote() {
    const parsedNote = NoteForm.safeParse(currentNote);

    if (!parsedNote.success) {
      setErrors(z.prettifyError(parsedNote.error));
      return;
    }

    setSubmitDisabled(true);

    try {
      if (isSignedIn) {
        const token = await getToken();

        if (!token) {
          setErrors("You need to be signed in to edit account notes");
          return;
        }

        const result = await updateNoteRequest(token, {
          id: currentNote.id,
          subject: parsedNote.data.subject,
          body: parsedNote.data.body,
          tags: parsedNote.data.tags,
          folder: parsedNote.data.folder,
          pinned: parsedNote.data.pinned,
        });
        const json = await result.json();

        if (!result.ok) {
          setErrors(json?.message ?? "Failed to update note");
          return;
        }

        setNotes((currentNotes) =>
          currentNotes.map((note) =>
            currentNote.id === note.id
              ? { ...note, ...parsedNote.data, updatedAt: json.updatedAt }
              : note,
          ),
        );

        setCurrentNote((note) => ({
          ...note,
          ...parsedNote.data,
          updatedAt: json.updatedAt,
        }));
        setErrors("");
        setStatusMessage("Note updated");
        navigate("/");
        return;
      }

      const existingNote = notes.find((note) => note.id === currentNote.id);

      if (!existingNote) {
        setErrors("Couldn't find note");
        return;
      }

      const updatedNote = {
        ...existingNote,
        subject: parsedNote.data.subject,
        body: parsedNote.data.body,
        tags: parsedNote.data.tags,
        folder: parsedNote.data.folder,
        pinned: parsedNote.data.pinned,
        updatedAt: new Date().toISOString(),
      };
      const nextNotes = notes.map((note) =>
        currentNote.id === note.id ? updatedNote : note,
      );

      saveNotes(nextNotes);
      setNotes(nextNotes);
      setCurrentNote(updatedNote);

      setErrors("");
      setStatusMessage("Note updated");
      navigate("/");
      refreshLocalImportCount();
    } catch {
      setErrors(
        isSignedIn ? "Failed to edit account note" : "Failed to edit note",
      );
    }
    finally {
      setSubmitDisabled(false);
    }
  }

  function resetCurrentNote() {
    setCurrentNote(createEmptyNote());
  }

  async function importLocalNotes() {
    if (!isSignedIn) {
      setErrors("Sign in to import browser notes");
      return;
    }

    const localNotes = loadNotes();

    if (!localNotes.length) {
      setErrors("No local notes available to import");
      return;
    }

    try {
      setDisableButtons(true);
      const token = await getToken();

      if (!token) {
        setErrors("You need to be signed in to import notes");
        return;
      }

      const result = await importNotesRequest(token, localNotes);
      const json = await result.json();

      if (!result.ok) {
        setErrors(json?.message ?? "Failed to import notes");
        return;
      }

      clearStoredNotes();
      refreshLocalImportCount();
      await loadAccountNotes();
      setErrors("");
      setStatusMessage(
        `Imported ${json.imported} note${json.imported === 1 ? "" : "s"}${json.skipped ? `, skipped ${json.skipped} duplicates` : ""}.`,
      );
    } catch {
      setErrors("Failed to import notes");
    } finally {
      setDisableButtons(false);
    }
  }

  async function toggleNoteSharing(noteId: string, shouldShare: boolean) {
    if (!isSignedIn) {
      setErrors("You need to be signed in to share notes");
      return;
    }

    try {
      setDisableButtons(true);
      const token = await getToken();

      if (!token) {
        setErrors("You need to be signed in to share notes");
        return;
      }

      const result = shouldShare
        ? await shareNoteRequest(token, noteId)
        : await unshareNoteRequest(token, noteId);
      const json = await result.json();

      if (!result.ok) {
        setErrors(json?.message ?? "Failed to update sharing");
        return;
      }

      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === noteId
            ? {
                ...note,
                isPublic: shouldShare,
                publicId: json.publicId ?? note.publicId,
                updatedAt: json.updatedAt ?? note.updatedAt,
              }
            : note,
        ),
      );
      setErrors("");
      setStatusMessage(shouldShare ? "Share link enabled" : "Share link disabled");
    } catch {
      setErrors("Failed to update sharing");
    } finally {
      setDisableButtons(false);
    }
  }

  return {
    notes,
    editNote,
    resetCurrentNote,
    createNote,
    loadingMessage,
    setErrors,
    errors,
    statusMessage,
    setCurrentNote,
    currentNote,
    deleteNote,
    restoreNote,
    permanentlyDeleteNote,
    submitDisabled,
    disableButtons,
    fetchNoteById,
    isFetchingNote,
    storageMode,
    importLocalNotes,
    localImportCount,
    toggleNoteSharing,
  };
};
