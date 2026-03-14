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

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    // if (!isSignedIn) {
    //   //setNotes([]);
    //   ..setLoadingMessage("Please sign in");
    //   return;
    // }

    let cancelled = false;
    // call fetchNotes() here

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
          setNotes(json.rows);
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
      const token = await getToken();
      const result = await deleteNoteRequest(token!, noteId);

      if (result.ok) {
        setNotes((notes) => notes.filter((note) => note.id !== noteId));
      } else {
        alert("Couldn't delete note");
      }
    } catch (error) {
      console.log(error);
    }
  }
  async function createNote() {
    const parsedNote = NoteForm.safeParse(currentNote);
    const token = await getToken();

    if (!parsedNote.success) {
      setErrors(z.prettifyError(parsedNote.error));
      return;
    }

    try {
      const result = await createNoteRequest(
        token!,
        parsedNote.data.subject,
        parsedNote.data.body,
      );

      if (!result.ok) {
        alert("Couldn't create the note");
        return;
      }

      const json = await result.json();

      resetCurrentNote();
      setMode("home");

      setNotes((notes) => [
        ...notes,
        {
          id: json.noteId,
          subject: parsedNote.data.subject,
          body: parsedNote.data.body,
        },
      ]);
    } catch (error) {
      alert("Couldn't create the note");
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
        alert("Couldn't update note");
        return;
      }

      setNotes((notes) =>
        notes.map((note) => (currentNote.id === note.id ? currentNote : note)),
      );

      resetCurrentNote();
      setMode("home");
    } catch (error) {
      alert("Couldn't update note");
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
  };
};