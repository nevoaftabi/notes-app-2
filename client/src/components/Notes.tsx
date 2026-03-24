import { useNavigate } from "react-router";
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
  resetCurrentNote: () => void;
};

function Notes({
  notes,
  setMode,
  deleteNote,
  setCurrentNote,
  setErrors,
  loadingMessage,
  errors,
  disableButtons,
  resetCurrentNote,
}: NotesProps) {
  const navigate = useNavigate();
  return (
    <div>
      <button
        className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!!loadingMessage || disableButtons}
        onClick={() => {
          resetCurrentNote();
          navigate("/notes/new");
          setErrors("");
        }}
        >
        Create Note
      </button>
      <div className="py-2">{errors}</div>
      {notes.length ? (
        [...notes]
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          )
          .map((note) => (
            <NoteItem
              setErrors={setErrors}
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
    </div>
  );
}

export default Notes;
