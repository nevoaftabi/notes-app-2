import type { Mode } from "../types";
import type { Note } from "../types";
import NoteItem from "./NoteItem";

type NotesProps = {
  loadingMessage: string;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  notes: Note[];
  errors: string;
  setErrors: React.Dispatch<React.SetStateAction<string>>;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
  deleteNote: (noteId: string) => void;
  disableButtons: boolean;
};

function Notes({
  notes,
  setMode,
  deleteNote,
  setCurrentNote,
  setErrors,
  loadingMessage,
  errors,
  disableButtons
}: NotesProps) {
  return (
    <div>
      <button
        disabled={!!loadingMessage || disableButtons}
        onClick={() => {
          setMode("create");
          setErrors("");
        }}
      >
        Create Note
      </button>
      {notes.length ? (
        notes.map((note) => (
          <NoteItem
            disableButtons={disableButtons}
            key={note.id}
            deleteNote={deleteNote}
            note={note}
            setCurrentNote={setCurrentNote}
            setMode={setMode}
          />
        ))
      ) : (
        <div>{loadingMessage ? loadingMessage : "No notes exist!"}</div>
      )}
      <div>{errors}</div>
    </div>
  );
}

export default Notes;
