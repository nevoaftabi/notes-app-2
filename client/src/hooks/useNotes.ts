import { useEffect, useCallback, useState } from "react";
import type { Note } from "../types";
import { NoteForm } from "../schemas";
import { z } from "zod";
import { useNavigate } from "react-router";
import { createStoredNote, loadNotes, saveNotes } from "../db";
import { useOptionalAuth } from "../auth-context";
import {
  createNoteRequest,
  deleteNoteRequest,
  fetchNoteRequest,
  fetchNotes,
  updateNoteRequest,
} from "../api";

export const useNotes = () => {
  const { accountsAvailable, getToken, isReady, isSignedIn } = useOptionalAuth();
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [currentNote, setCurrentNote] = useState<Note>({
    id: "",
    subject: "",
    body: "",
    createdAt: "",
    updatedAt: ""
  });
  const [notes, setNotes] = useState<Note[]>([]);
  const [errors, setErrors] = useState("");
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [disableButtons, setDisableButtons] = useState(false);
  const [isFetchingNote, setFetchingNote] = useState(false);

  const navigate = useNavigate();
  const storageMode: "local" | "account" = isSignedIn ? "account" : "local";

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
        const token = await getToken();

        if (!token) {
          if (!cancelled) {
            setLoadingMessage("Failed to fetch account notes");
          }
          return;
        }

        const res = await fetchNotes(token);

        if (!res.ok) {
          if (!cancelled) {
            setLoadingMessage("Failed to fetch account notes");
          }
          return;
        }

        const json = await res.json();

        if (!cancelled) {
          setNotes(json?.rows ?? []);
          setLoadingMessage("");
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
  }, [accountsAvailable, getToken, isReady, isSignedIn]);

  const fetchNoteById = useCallback(async (noteId: string) => {
    try {
      setFetchingNote(true);

      if (!isSignedIn) {
        const note = loadNotes().find((storedNote) => storedNote.id === noteId);

        if (note) {
          setCurrentNote(note);
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
        const nextNotes = notes.filter((note) => note.id !== noteId);

        saveNotes(nextNotes);
        setNotes(nextNotes);
        setErrors("");
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
          currentNotes.filter((note) => note.id !== noteId),
        );
        setErrors("");
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
        );
        const nextNotes = [newNote, ...notes];

        saveNotes(nextNotes);

        resetCurrentNote();
        navigate("/");
        setErrors("");
        setNotes(nextNotes);
        return;
      }

      const token = await getToken();

      if (!token) {
        setErrors("You need to be signed in to create account notes");
        return;
      }

      const result = await createNoteRequest(
        token,
        parsedNote.data.subject,
        parsedNote.data.body,
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
        createdAt: json.createdAt,
        updatedAt: json.updatedAt,
      };

      resetCurrentNote();
      navigate("/");
      setErrors("");
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
        updatedAt: new Date().toISOString(),
      };
      const nextNotes = notes.map((note) =>
        currentNote.id === note.id ? updatedNote : note,
      );

      saveNotes(nextNotes);
      setNotes(nextNotes);
      setCurrentNote(updatedNote);

      setErrors("");
      navigate("/");
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
    setCurrentNote({ id: "", subject: "", body: "", createdAt: "", updatedAt: "" });
  }

  return {
    notes,
    editNote,
    resetCurrentNote,
    createNote,
    loadingMessage,
    setErrors,
    errors,
    setCurrentNote,
    currentNote,
    deleteNote,
    submitDisabled,
    disableButtons,
    fetchNoteById,
    isFetchingNote,
    storageMode,
  };
};
