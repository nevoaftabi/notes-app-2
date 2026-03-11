import { useState, useEffect } from "react";
import type { Note } from "./note";

type CreateNoteProps = {
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  currentNote: Note;
  createNote: () => void;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
  resetNoteInput: () => void;
};

type EditNoteProps = CreateNoteProps & {
  notes: Note[];
  currentNote: Note;
  submitNoteEdit: () => void;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
};

type NotesProps = {
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  notes: Note[];
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
  deleteNote: (noteId: string) => void;
};

type Mode = "home" | "edit" | "create";

function CreateNote({
  setMode,
  currentNote,
  setCurrentNote,
  resetNoteInput,
  createNote,
}: CreateNoteProps) {
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
      <button onClick={() => createNote()}>Submit</button>
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

function Notes({ notes, setMode, deleteNote, setCurrentNote }: NotesProps) {
  return (
    <div>
      <button onClick={() => setMode("create")}>Create Note</button>
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
        <div>No notes exist!</div>
      )}
    </div>
  );
}

function App() {
  const [mode, setMode] = useState<Mode>("home");
  const [currentNote, setCurrentNote] = useState<Note>({
    id: "",
    subject: "",
    body: "",
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const raw = localStorage.getItem("notes");

      if (raw === null) return [];

      const parsed = JSON.parse(raw);

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.log(error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("notes", JSON.stringify(notes));
    } catch (error) {
      alert("Couldn't save changes. Try again later. " + error);
    }
  }, [notes]);

  function deleteNote(noteId: string) {
    setNotes((notes) => notes.filter((note) => note.id !== noteId));
  }

  function createNote() {
    const trimmedSubject = currentNote?.subject.trim();
    const trimmedBody = currentNote?.body.trim();

    resetNoteInput();

    if (!trimmedSubject || !trimmedBody) {
      alert("Subject or body is missing.");

      return;
    }

    setNotes([
      ...notes,
      { id: crypto.randomUUID(), subject: trimmedSubject, body: trimmedBody },
    ]);
    setMode("home");
    resetNoteInput();
  }

  function submitNoteEdit() {
    setNotes((notes) =>
      notes.map((note) => (currentNote.id === note.id ? currentNote : note)),
    );
    resetNoteInput();
    setMode("home");
  }

  function resetNoteInput() {
    setCurrentNote({ id: "", subject: "", body: ""});
  }

  return (
    <>
      {mode === "create" && (
        <CreateNote
          setCurrentNote={setCurrentNote}
          createNote={createNote}
          currentNote={currentNote}
          resetNoteInput={resetNoteInput}
          setMode={setMode}
        />
      )}
      {mode === "edit" && (
        <EditNote
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
