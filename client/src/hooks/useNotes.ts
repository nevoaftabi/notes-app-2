import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import type { Mode, Note } from "../types";
import {
  createNoteRequest,
  deleteNoteRequest,
  fetchNotes,
  updateNoteRequest,
} from "../api";
import { NoteForm } from "../schemas";
import { z } from "zod";

export const useNotes = () => {
  const [mode, setMode] = useState<Mode>("home");
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [currentNote, setCurrentNote] = useState<Note>({
    id: "",
    subject: "",
    body: "",
  });
  const [notes, setNotes] = useState<Note[]>([]);
  const [errors, setErrors] = useState("");
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [disableButtons, setDisableButtons] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      const token = await getToken();

      try {
        if (!token) {
          if (!cancelled) {
            setLoadingMessage("Failed to fetch");
          }
          return;
        }

        const res = await fetchNotes(token);

        if (!res.ok) {
          if (!cancelled) {
            setLoadingMessage("Failed to fetch");
          }
          return;
        } else if (!cancelled) {
          setLoadingMessage("");
        }

        const json = await res.json();
        if (!cancelled) {
          setNotes(json?.rows ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadingMessage("Failed to fetch");
        }
        console.log(error);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn]);

  async function deleteNote(noteId: string) {
    try {
      setDisableButtons(true);

      const token = await getToken();
      const result = await deleteNoteRequest(token!, noteId);

      if (result.ok) {
        setNotes((notes) => notes.filter((note) => note.id !== noteId));
      } else {
        const json = await result.json();
        setErrors(json?.message);
      }
    } catch {
      setErrors("Failed to fetch");
    }

    setDisableButtons(false);
  }
  async function createNote() {
    const parsedNote = NoteForm.safeParse(currentNote);

    if (!parsedNote.success) {
      setErrors(z.prettifyError(parsedNote.error));
      return;
    }

    setSubmitDisabled(true);

    const token = await getToken();

    try {
      const result = await createNoteRequest(
        token!,
        parsedNote.data.subject,
        parsedNote.data.body,
      );
      const json = await result.json();

      if (!result.ok) {
        setErrors(json?.message);
        setSubmitDisabled(false);
        return;
      }

      resetCurrentNote();
      setMode("home");
      setErrors("");
      setSubmitDisabled(false);

      setNotes((notes) => [
        ...notes,
        {
          id: json.noteId,
          subject: parsedNote.data.subject,
          body: parsedNote.data.body,
        },
      ]);
    } catch {
      setErrors("Failed to fetch");
      setSubmitDisabled(false);
    }
  }

  async function editNote() {
    const parsedNote = NoteForm.safeParse(currentNote);

    if (!parsedNote.success) {
      setErrors(z.prettifyError(parsedNote.error));
      return;
    }

    try {
      const token = await getToken();
      const result = await updateNoteRequest(token!, {
        id: currentNote.id,
        subject: parsedNote.data.subject,
        body: parsedNote.data.body,
      });

      if (!result.ok) {
        const json = await result.json();
        setErrors(json?.message);

        return;
      }

      setNotes((notes) =>
        notes.map((note) => (currentNote.id === note.id ? currentNote : note)),
      );

      resetCurrentNote();
      setMode("home");
      setErrors("");
    } catch {
      setErrors("Failed to fetch");
    }
  }

  function resetCurrentNote() {
    setCurrentNote({ id: "", subject: "", body: "" });
  }

  return {
    mode,
    notes,
    editNote,
    resetCurrentNote,
    createNote,
    setMode,
    loadingMessage,
    setErrors,
    errors,
    setCurrentNote,
    currentNote,
    deleteNote,
    submitDisabled,
    disableButtons,
  };
};
