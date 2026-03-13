import type { Mode } from "../App";
import type { Note } from "../note";

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

export default Notes;