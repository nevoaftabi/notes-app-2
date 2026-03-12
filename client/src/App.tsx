// TODO:
// Add loading text
// Add autosave
// Make createTodo optimistic
// Make delete optimistic
// Make the edit button work & edit route
// When a user is deleted, all of their notes also have to be deleted
// Optimizations/bug fixes

import { useState, useEffect } from "react";
import type { Note } from "./note";
import { NoteForm } from "./schemas";
import { z } from "zod";
import { useAuth } from "@clerk/clerk-react";

type CreateNoteProps = {
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  currentNote: Note;
  createNote: () => void;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
  resetNoteInput: () => void;
  errors: string;
  setErrors: React.Dispatch<React.SetStateAction<string>>;
};

type EditNoteProps = CreateNoteProps & {
  notes: Note[];
  currentNote: Note;
  submitNoteEdit: () => void;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
  setErrors: React.Dispatch<React.SetStateAction<string>>;
};

type NotesProps = {
  loadingMessage: string;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  notes: Note[];
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
  deleteNote: (noteId: string) => void;
};

type Mode = "home" | "edit" | "create";

// Add autosave

function CreateNote({
  setMode,
  currentNote,
  setCurrentNote,
  resetNoteInput,
  createNote,
  setErrors,
  errors,
}: CreateNoteProps) {
  return (
    <div>
      <label htmlFor="">Subject</label>
      <input
        type="text"
        onChange={(e) => {
          setCurrentNote({ ...currentNote, subject: e.target.value });
          setErrors("");
        }}
        value={currentNote.subject}
      />
      <button
        onClick={() => {
          setMode("home");
          resetNoteInput();
          setErrors("");
        }}
      >
        Back
      </button>
      <br />
      <br />
      <label htmlFor="">Body</label>
      <textarea
        name=""
        id=""
        style={{ width: 200, height: 200 }}
        onChange={(e) => {
          setCurrentNote({ ...currentNote, body: e.target.value });
          setErrors("");
        }}
        value={currentNote.body}
      ></textarea>
      <br />
      <br />
      <button onClick={() => createNote()}>Submit</button>
      <div>{errors}</div>
    </div>
  );
}

function EditNote({
  setMode,
  resetNoteInput,
  currentNote,
  notes,
  setCurrentNote,
  submitNoteEdit,
  setErrors,
}: EditNoteProps) {
  useEffect(() => {
    const note = notes.find((note) => note.id === currentNote.id);

    if (note?.subject && note?.body) {
      setCurrentNote({ ...note, subject: note.subject, body: note.body });
    } else {
      alert("Couldn't find the note you wanted to edit");
    }
  }, []);
  return (
    <div>
      <label htmlFor="">Subject</label>
      <input
        type="text"
        onChange={(e) =>
          setCurrentNote({ ...currentNote, subject: e.target.value })
        }
        value={currentNote.subject}
      />
      <button
        onClick={() => {
          setMode("home");
          resetNoteInput();
          setErrors("");
        }}
      >
        Back
      </button>
      <br />
      <br />
      <label htmlFor="">Body</label>
      <textarea
        name=""
        id=""
        style={{ width: 200, height: 200 }}
        onChange={(e) =>
          setCurrentNote({ ...currentNote, body: e.target.value })
        }
        value={currentNote.body}
      ></textarea>
      <br />
      <br />
      <button onClick={() => submitNoteEdit()}>Submit</button>
    </div>
  );
}

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
                  setCurrentNote({ id: note.id, subject: "", body: "" });
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
  const { userId, sessionId, getToken, isLoaded, isSignedIn } = useAuth();
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [currentNote, setCurrentNote] = useState<Note>({
    id: "",
    subject: "",
    body: "",
  });
  const [notes, setNotes] = useState<Note[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const token = await getToken();

      try {
        const res = await fetch("http://localhost:3000/api/auth/notes", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setLoadingMessage("Failed to fetch");
          return;
        } else {
          setLoadingMessage("");
        }

        const json = await res.json();
        setNotes(json.rows);
      } catch (error) {
        setLoadingMessage("Failed to fetch");
        console.log(error);
      }
    };

    fetchData();
  }, []);
  const [errors, setErrors] = useState("");

  async function deleteNote(noteId: string) {
    try {
      const token = await getToken();
      const result = await fetch(
        `http://localhost:3000/api/auth/notes/${encodeURIComponent(noteId)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (result.ok) {
        setNotes((notes) => notes.filter((note) => note.id !== noteId));
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

    const { subject, body } = parsedNote.data;

    try {
      const token = await getToken();
      const result = await fetch("http://localhost:3000/api/auth/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject,
          body,
        }),
      });

      if (!result.ok) {
        alert("Couldn't create the note");
        return;
      }

      const json = await result.json();
      console.log(json);

      resetNoteInput();
      setMode("home");

      setNotes([
        ...notes,
        {
          id: json.noteId,
          subject,
          body,
        },
      ]);
    } catch (error) {
      alert("Couldn't create the note");
    }
  }

  async function submitNoteEdit() {
    try {
      const token = await getToken();
      const result = await fetch(
        `http://localhost:3000/api/auth/notes/${encodeURIComponent(currentNote.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject: currentNote.subject,
            body: currentNote.body,
          }),
        },
      );

      if (!result.ok) {
        alert("Couldn't update note");
        return;
      }

      setNotes((notes) =>
        notes.map((note) => (currentNote.id === note.id ? currentNote : note)),
      );
      resetNoteInput();
      setMode("home");
    } catch (error) {
      alert("Couldn't update note");
    }
  }

  function resetNoteInput() {
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
          resetNoteInput={resetNoteInput}
          setMode={setMode}
        />
      )}
      {mode === "edit" && (
        <EditNote
          setErrors={setErrors}
          errors={errors}
          createNote={createNote}
          currentNote={currentNote}
          notes={notes}
          resetNoteInput={resetNoteInput}
          setCurrentNote={setCurrentNote}
          setMode={setMode}
          submitNoteEdit={submitNoteEdit}
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
