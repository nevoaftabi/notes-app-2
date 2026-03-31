import { useEffect, useCallback, useState } from "react";
import type { Note } from "../types";
import { NoteForm } from "../schemas";
import { z } from "zod";
import { useNavigate } from "react-router";
import { createStoredNote, loadNotes, saveNotes } from "../db";

export const useNotes = () => {
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

  useEffect(() => {
    const storedNotes = loadNotes();

    setNotes(storedNotes);
    setLoadingMessage("");
  }, []);

  const fetchNoteById = useCallback(async (noteId: string) => {
    try {
      setFetchingNote(true);

      const note = loadNotes().find((storedNote) => storedNote.id === noteId);

      if (note) {
        setCurrentNote(note);
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
  }, [navigate]);

  async function deleteNote(noteId: string) {
    try {
      setDisableButtons(true);
      const nextNotes = notes.filter((note) => note.id !== noteId);

      saveNotes(nextNotes);
      setNotes(nextNotes);
      setErrors("");
    } catch {
      setErrors("Failed to delete note");
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
    } catch {
      setErrors("Failed to create note");
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
      setErrors("Failed to edit note");
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
    isFetchingNote
  };
};
