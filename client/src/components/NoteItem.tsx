import { useNavigate } from "react-router";
import type { Note } from "../types";
import { getReadableDate } from "../utils";

type NoteItemProps = {
  note: Note;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
  deleteNote: (noteId: string) => void;
  restoreNote: (noteId: string) => void;
  permanentlyDeleteNote: (noteId: string) => void;
  disableButtons: boolean;
  setErrors: React.Dispatch<React.SetStateAction<string>>;
  storageMode: "local" | "account";
  toggleNoteSharing: (noteId: string, shouldShare: boolean) => void;
  viewMode: "active" | "trash";
};

const NoteItem = ({
  note,
  deleteNote,
  restoreNote,
  permanentlyDeleteNote,
  setCurrentNote,
  setErrors,
  disableButtons,
  storageMode,
  toggleNoteSharing,
  viewMode,
}: NoteItemProps) => {
  const navigate = useNavigate();
  const shareUrl =
    note.publicId && typeof window !== "undefined"
      ? `${window.location.origin}/shared/${note.publicId}`
      : "";

  return (
    <div className="my-5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {note.pinned ? (
            <span className="rounded-full bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-200">
              Pinned
            </span>
          ) : null}
          {note.folder ? (
            <span className="rounded-full bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300">
              {note.folder}
            </span>
          ) : null}
          {storageMode === "account" && note.isPublic ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-200">
              Shared
            </span>
          ) : null}
        </div>
        <p className="mt-2 truncate text-base font-semibold text-slate-100">
          {note.subject.length > 50
            ? note.subject.slice(0, 50) + "..."
            : note.subject}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {note.body.length > 50 ? note.body.slice(0, 50) + "..." : note.body}
        </p>
        {note.tags.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {note.tags.map((tag, index) => (
              <span
                key={`${note.id}-${tag}-${index}`}
                className="rounded-full bg-sky-500/15 px-2 py-1 text-xs font-medium text-sky-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="ml-4 flex flex-wrap items-center justify-end gap-2 self-center">
        <div className="group relative inline-flex items-center">
          <button
            type="button"
            aria-label="Show note timestamps"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-xs font-bold text-slate-200 transition hover:border-sky-400 hover:text-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
          >
            i
          </button>
          <div className="pointer-events-none absolute right-0 top-full z-10 mt-2 w-64 whitespace-pre-line rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-left text-xs text-slate-100 opacity-0 shadow-lg transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
            {`Created at: ${getReadableDate(note.createdAt)}\nUpdated at: ${getReadableDate(note.updatedAt)}`}
          </div>
        </div>
        {viewMode === "active" && storageMode === "account" ? (
          <>
            <button
              className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-100 transition hover:border-sky-400 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disableButtons}
              onClick={() => toggleNoteSharing(note.id, !note.isPublic)}
            >
              {note.isPublic ? "Unshare" : "Share"}
            </button>
            {note.isPublic && note.publicId ? (
              <button
                className="rounded-lg border border-emerald-700 px-4 py-2 font-medium text-emerald-200 transition hover:border-emerald-500 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disableButtons}
                onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl);
                  setErrors("");
                }}
              >
                Copy Link
              </button>
            ) : null}
          </>
        ) : null}
        {viewMode === "trash" ? (
          <>
            <button
              className="rounded-lg border border-emerald-700 px-4 py-2 font-medium text-emerald-200 transition hover:border-emerald-500 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disableButtons}
              onClick={() => restoreNote(note.id)}
            >
              Restore
            </button>
            <button
              className="rounded-lg bg-red-700 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disableButtons}
              onClick={() => permanentlyDeleteNote(note.id)}
            >
              Delete Permanently
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default NoteItem;
