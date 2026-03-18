

import type { Mode, Note } from "../types";

type NoteItemProps = {
  note: Note;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
  deleteNote: (noteId: string) => void;
  disableButtons: boolean;
};

const NoteItem = ({
  note,
  deleteNote,
  setCurrentNote,
  setMode,
  disableButtons,
}: NoteItemProps) => {
  return (
    <div className="my-5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-slate-100" >
          {note.subject.length > 50 ? note.subject.slice(0, 50) + "..." : note.subject }
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {note.body.length > 50 ? note.body.slice(0, 50) + "..." : note.body}
        </p>
      </div>
      <div className="ml-4 flex items-center gap-2">
        <button
          className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disableButtons}
          onClick={() => deleteNote(note.id)}
        >
          Delete
        </button>
        <button
          className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disableButtons}
          onClick={() => {
            setCurrentNote(note);
            setMode("edit");
          }}
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default NoteItem;
