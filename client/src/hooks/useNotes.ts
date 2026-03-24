import { useAuth } from "@clerk/clerk-react";
import { useEffect, useCallback, useState } from "react";
import type { Note } from "../types";
import {
  createNoteRequest,
  deleteNoteRequest,
  fetchNotes,
  fetchNoteRequest,
  updateNoteRequest,
} from "../api";
import { NoteForm } from "../schemas";
import { z } from "zod";
import { useNavigate } from "react-router";

export const useNotes = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
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

  const fetchNoteById = useCallback(async (noteId: string) => {
    try {
      setFetchingNote(true);

      const token = await getToken();
      const result = await fetchNoteRequest(token!, noteId);

      if(result.ok) {
        const json = await result.json();
        setCurrentNote(json);
      }
      else {
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
  }, [getToken, navigate]);

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
        return;
      }

      resetCurrentNote();
      navigate("/");
      setErrors("");

      setNotes((notes) => [
        ...notes,
        {
          id: json.noteId,
          subject: parsedNote.data.subject,
          body: parsedNote.data.body,
          createdAt: json.createdAt,
          updatedAt: json.updatedAt
        },
      ]);
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
      const token = await getToken();
      const result = await updateNoteRequest(token!, {
        id: currentNote.id,
        subject: parsedNote.data.subject,
        body: parsedNote.data.body,
      });

      const json = await result.json();
      
      if (!result.ok) {
        setErrors(json?.message);
        return;
      }

      setNotes((notes) =>
        notes.map((note) => (currentNote.id === note.id ? { ...currentNote, updatedAt: json.updatedAt} : note)),
      );

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
