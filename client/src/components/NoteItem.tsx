import { useNavigate } from "react-router";
import type { Note } from "../types";
import { getReadableDate } from "../utils";

type NoteItemProps = {
  note: Note;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
  deleteNote: (noteId: string) => void;
  disableButtons: boolean;
  setErrors: React.Dispatch<React.SetStateAction<string>>;
};

const NoteItem = ({
  note,
  deleteNote,
  setCurrentNote,
  setErrors,
  disableButtons,
}: NoteItemProps) => {
  const navigate = useNavigate();

  return (
    <div className="my-5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-slate-100">
          {note.subject.length > 50
            ? note.subject.slice(0, 50) + "..."
            : note.subject}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {note.body.length > 50 ? note.body.slice(0, 50) + "..." : note.body}
        </p>
      </div>
      <div className="relative inline-block p-1 group">
        <button
          type="button"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-200"
        >
          i
        </button>
        <div className="absolute right-0 top-full z-10 mt-1 hidden w-64 whitespace-pre-line rounded-md bg-slate-800 px-3 py-2 text-left text-xs text-slate-100 shadow-lg group-hover:block">
          {`Created at: ${getReadableDate(note.createdAt)}\n`}
          {`Updated at: ${getReadableDate(note.updatedAt)}`}
        </div>
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
            setErrors("");
            navigate(`/notes/${note.id}/edit`);
          }}
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default NoteItem;
