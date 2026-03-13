import type { Mode } from "../types";
import type { Note } from "../types";
import NoteItem from "./NoteItem";

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
          <NoteItem key={note.id} deleteNote={deleteNote} note={note} setCurrentNote={setCurrentNote} setMode={setMode} />
        ))
      ) : (
        <div>{loadingMessage ? loadingMessage : "No notes exist!"}</div>
      )}
    </div>
  );
}

export default Notes;
