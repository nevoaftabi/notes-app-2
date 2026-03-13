// TODO:
// Add autosave
// Make delete optimistic
// When a user is deleted, all of their notes also have to be deleted
// Optimizations/bug fixes

import { useState, useEffect } from "react";
import type { Note } from "./note";
import { NoteForm } from "./schemas";
import { z } from "zod";
import { useAuth } from "@clerk/clerk-react";
import { authFetch } from "./api";
import CreateNote from './components/CreateNote'
import EditNote from "./components/EditNote";

export type Mode = "home" | "edit" | "create";

type NotesProps = {
  loadingMessage: string;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  notes: Note[];
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
  deleteNote: (noteId: string) => void;
};

function Notes({
  notes,
  setMode,
  deleteNote,
  setCurrentNote,
  loadingMessage,
}: NotesProps) {
  return (
    <div>
      <button disabled={!!loadingMessage} onClick={() => setMode("create")}>
        Create Note
      </button>
      {notes.length ? (
        notes.map((note) => (
          <div key={note.id}>
            <span>
              {note.subject} | {note.body}{" "}
              <button onClick={() => deleteNote(note.id)}>Delete</button>
              <button
                onClick={() => {
                  setCurrentNote(note);
                  setMode("edit");
                }}
              >
                Edit
              </button>
            </span>
          </div>
        ))
      ) : (
        <div>{loadingMessage ? loadingMessage : "No notes exist!"}</div>
      )}
    </div>
  );
}

function App() {
  const [mode, setMode] = useState<Mode>("home");
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [currentNote, setCurrentNote] = useState<Note>({
    id: "",
    subject: "",
    body: "",
  });
  const [notes, setNotes] = useState<Note[]>([]);
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setNotes([]);
      setLoadingMessage("Please sign in");
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

        const res = await authFetch(
          "http://localhost:3000/api/auth/notes",
          "GET",
          token!,
        );

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
  const [errors, setErrors] = useState("");

  async function deleteNote(noteId: string) {
    try {
      const token = await getToken();
      const result = await authFetch(
        `http://localhost:3000/api/auth/notes/${encodeURIComponent(noteId)}`,
        "DELETE",
        token!,
      );

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

    if (!parsedNote.success) {
      setErrors(z.prettifyError(parsedNote.error));
      return;
    }

    try {
      const token = await getToken();

      const result = await authFetch(
        "http://localhost:3000/api/auth/notes",
        "POST",
        token!,
        JSON.stringify({
          subject: parsedNote.data.subject,
          body: parsedNote.data.body,
        }),
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

      const result = await authFetch(
        `http://localhost:3000/api/auth/notes/${encodeURIComponent(currentNote.id)}`,
        "PATCH",
        token!,
        JSON.stringify({
          subject: parsedNote.data.subject,
          body: parsedNote.data.body,
        }),
      );

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

  return (
    <>
      {mode === "create" && (
        <CreateNote
          setErrors={setErrors}
          errors={errors}
          setCurrentNote={setCurrentNote}
          createNote={createNote}
          currentNote={currentNote}
          resetCurrentNote={resetCurrentNote}
          setMode={setMode}
        />
      )}
      {mode === "edit" && (
        <EditNote
          setErrors={setErrors}
          errors={errors}
          createNote={createNote}
          currentNote={currentNote}
          resetCurrentNote={resetCurrentNote}
          setCurrentNote={setCurrentNote}
          setMode={setMode}
          editNote={editNote}
        />
      )}
      {mode === "home" && (
        <Notes
          loadingMessage={loadingMessage}
          deleteNote={deleteNote}
          setCurrentNote={setCurrentNote}
          setMode={setMode}
          notes={notes}
        />
      )}
    </>
  );
}

export default App;
