import { useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { Note } from "../types";
import NoteItem from "./NoteItem";

type NotesProps = {
  loadingMessage: string;
  notes: Note[];
  errors: string;
  statusMessage: string;
  setErrors: React.Dispatch<React.SetStateAction<string>>;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
  deleteNote: (noteId: string) => void;
  disableButtons: boolean;
  resetCurrentNote: () => void;
  storageMode: "local" | "account";
  importLocalNotes: () => void;
  localImportCount: number;
  restoreNote: (noteId: string) => void;
  permanentlyDeleteNote: (noteId: string) => void;
  toggleNoteSharing: (noteId: string, shouldShare: boolean) => void;
};

function Notes({
  notes,
  deleteNote,
  setCurrentNote,
  setErrors,
  loadingMessage,
  errors,
  statusMessage,
  disableButtons,
  resetCurrentNote,
  storageMode,
  importLocalNotes,
  localImportCount,
  restoreNote,
  permanentlyDeleteNote,
  toggleNoteSharing,
}: NotesProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"active" | "trash">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"updated-desc" | "updated-asc">(
    "updated-desc",
  );
  const [folderFilter, setFolderFilter] = useState("all");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const pageSize = 6;

  const folderOptions = useMemo(
    () =>
      Array.from(
        new Set(
          notes
            .filter((note) =>
              viewMode === "trash" ? Boolean(note.deletedAt) : !note.deletedAt,
            )
            .map((note) => note.folder.trim())
            .filter((folder) => folder.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [notes, viewMode],
  );

  const filteredNotes = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    const matchingNotes = notes.filter((note) => {
      const matchesView = viewMode === "trash" ? Boolean(note.deletedAt) : !note.deletedAt;
      const matchesQuery = normalizedQuery
        ? `${note.subject} ${note.body} ${note.folder} ${note.tags.join(" ")}`
            .toLowerCase()
            .includes(normalizedQuery)
        : true;
      const matchesFolder =
        folderFilter === "all" ? true : note.folder.trim() === folderFilter;
      const matchesPinned = showPinnedOnly ? note.pinned : true;

      return matchesView && matchesQuery && matchesFolder && matchesPinned;
    });

    return [...matchingNotes].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return Number(b.pinned) - Number(a.pinned);
      }

      const timeDifference =
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();

      return sortOrder === "updated-asc" ? timeDifference : -timeDifference;
    });
  }, [deferredSearchQuery, folderFilter, notes, showPinnedOnly, sortOrder, viewMode]);

  const activeNotesCount = notes.filter((note) => !note.deletedAt).length;
  const trashedNotesCount = notes.filter((note) => Boolean(note.deletedAt)).length;
  const hasNotes = notes.length > 0;
  const hasNotesInCurrentView = viewMode === "trash" ? trashedNotesCount > 0 : activeNotesCount > 0;
  const hasSearchQuery = searchQuery.trim().length > 0;
  const activeSearchQuery = searchQuery.trim();
  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedNotes = filteredNotes.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

  const emptyStateMessage = hasSearchQuery
    ? `No notes match "${activeSearchQuery}".`
    : viewMode === "trash"
      ? "Trash is empty."
    : showPinnedOnly
      ? "No pinned notes found."
      : folderFilter !== "all"
        ? folderFilter
          ? `No notes found in the "${folderFilter}" folder.`
          : "No notes without a folder were found."
        : "No notes match the current filters.";
  const showNoteLookupMessage = errors.startsWith("Couldn't find note with ID");

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-1">
          <button
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${viewMode === "active" ? "bg-sky-600 text-white" : "text-slate-300 hover:text-slate-100"}`}
            onClick={() => {
              setViewMode("active");
              setCurrentPage(1);
              setShowPinnedOnly(false);
              setErrors("");
            }}
          >
            Notes ({activeNotesCount})
          </button>
          <button
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${viewMode === "trash" ? "bg-red-600 text-white" : "text-slate-300 hover:text-slate-100"}`}
            onClick={() => {
              setViewMode("trash");
              setCurrentPage(1);
              setShowPinnedOnly(false);
              setErrors("");
            }}
          >
            Trash ({trashedNotesCount})
          </button>
        </div>
        <button
          className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!!loadingMessage || disableButtons || viewMode === "trash"}
          onClick={() => {
            resetCurrentNote();
            navigate("/notes/new");
            setErrors("");
          }}
        >
          Create Note
        </button>
        {storageMode === "account" && localImportCount > 0 ? (
          <button
            className="rounded-lg border border-emerald-700 px-4 py-2 font-medium text-emerald-200 transition hover:border-emerald-500 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disableButtons}
            onClick={importLocalNotes}
          >
            Import {localImportCount} local note{localImportCount === 1 ? "" : "s"}
          </button>
        ) : null}
      </div>
      {hasNotesInCurrentView ? (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Search notes
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-sm font-medium text-slate-500">
                Search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Title, content, folder, or tag"
                aria-label="Search notes"
                className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 pl-20 pr-4 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-400/40"
              />
            </div>
          </label>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[220px_220px_auto]">
            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Folder
              </span>
              <select
                value={folderFilter}
                onChange={(event) => {
                  setFolderFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="block min-h-11 w-full min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/40"
              >
                <option value="all">All folders</option>
                <option value="">No folder</option>
                {folderOptions.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>
            </label>
            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Sort by
              </span>
              <select
                value={sortOrder}
                onChange={(event) => {
                  setSortOrder(event.target.value as "updated-desc" | "updated-asc");
                  setCurrentPage(1);
                }}
                className="block min-h-11 w-full min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/40"
              >
                <option value="updated-desc">Recently updated</option>
                <option value="updated-asc">Least recently updated</option>
              </select>
            </label>
            {viewMode === "active" ? (
              <label className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-200 xl:self-end">
                <input
                  type="checkbox"
                  checked={showPinnedOnly}
                  onChange={(event) => {
                    setShowPinnedOnly(event.target.checked);
                    setCurrentPage(1);
                  }}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-400/40"
                />
                Show pinned only
              </label>
            ) : (
              <div className="flex min-w-0 items-center rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-300 xl:self-end">
                Deleted notes stay here until you restore or permanently remove them.
              </div>
            )}
          </div>
        </div>
      ) : null}
      {errors ? (
        <div
          className={
            showNoteLookupMessage
              ? "mt-4 mb-2 rounded-lg border border-red-900 bg-red-500/10 px-3 py-2 text-sm text-red-200"
              : "py-2 text-sm text-red-300"
          }
        >
          {errors}
        </div>
      ) : null}
      {statusMessage ? (
        <div className="mt-4 mb-2 rounded-lg border border-emerald-900 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {statusMessage}
        </div>
      ) : null}
      {hasNotesInCurrentView ? (
        filteredNotes.length ? (
          paginatedNotes.map((note) => (
            <NoteItem
              setErrors={setErrors}
              disableButtons={disableButtons}
              key={note.id}
              deleteNote={deleteNote}
              restoreNote={restoreNote}
              permanentlyDeleteNote={permanentlyDeleteNote}
              note={note}
              setCurrentNote={setCurrentNote}
              storageMode={storageMode}
              toggleNoteSharing={toggleNoteSharing}
              viewMode={viewMode}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 px-4 py-8 text-center text-slate-300">
            {emptyStateMessage}
          </div>
        )
      ) : hasNotes ? (
        <div>{emptyStateMessage}</div>
      ) : (
        <div>{loadingMessage ? loadingMessage : "No notes exist!"}</div>
      )}
      {hasNotesInCurrentView && hasSearchQuery ? (
        <div className="mt-3 text-sm text-slate-400">
          Showing {filteredNotes.length} of {viewMode === "trash" ? trashedNotesCount : activeNotesCount} notes
        </div>
      ) : null}
      {filteredNotes.length > pageSize ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
          <p className="text-sm text-slate-400">
            Page {safeCurrentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-400 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Previous
            </button>
            <button
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-400 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safeCurrentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Notes;
