import { useNavigate, useParams } from "react-router";
import type { Note } from "../types";
import { useEffect, useState } from "react";
import { z } from "zod";

type NoteEditorProps = {
  currentNote: Note;
  createNote: () => void;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
  errors: string;
  setErrors: React.Dispatch<React.SetStateAction<string>>;
  editNote: () => void;
  submitDisabled: boolean;
  fetchNoteById: (noteId: string) => void;
  isFetchingNote: boolean;
};

function NoteEditor({
  currentNote,
  setCurrentNote,
  editNote,
  createNote,
  submitDisabled,
  setErrors,
  errors,
  fetchNoteById,
  isFetchingNote,
}: NoteEditorProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const isDisabled = isFetchingNote || submitDisabled;
  const [tagInputs, setTagInputs] = useState<string[]>(currentNote.tags);

  useEffect(() => {
    if (!id || isFetchingNote) return;

    const parsedId = z.uuid().safeParse(id);

    if (!parsedId.success) {
      navigate("/");
      return;
    }

    if (currentNote.id === parsedId.data) {
      return;
    }

    fetchNoteById(parsedId.data);
  }, [id, isEditMode, isFetchingNote, fetchNoteById, currentNote.id, navigate]);

  function normalizeTags(tags: string[]) {
    return tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .filter((tag, index, values) => values.indexOf(tag) === index);
  }

  function updateTagInput(index: number, value: string) {
    const nextInputs = tagInputs.map((tag, currentIndex) =>
      currentIndex === index ? value : tag,
    );

    setTagInputs(nextInputs);
    setCurrentNote({ ...currentNote, tags: normalizeTags(nextInputs) });
    setErrors("");
  }

  function addTagInput() {
    if (tagInputs.length >= 8) {
      return;
    }

    setTagInputs([...tagInputs, ""]);
    setErrors("");
  }

  function removeTagInput(index: number) {
    const nextInputs = tagInputs.filter((_, currentIndex) => currentIndex !== index);

    setTagInputs(nextInputs);
    setCurrentNote({ ...currentNote, tags: normalizeTags(nextInputs) });
    setErrors("");
  }

  return (
    <div className="mx-auto mt-12 max-w-4xl space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200">Subject</label>
        <input
          maxLength={100}
          type="text"
          className="resize-none w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
          onChange={(e) => {
            setCurrentNote({ ...currentNote, subject: e.target.value });
            setErrors("");
          }}
          disabled={isDisabled}
          value={currentNote.subject}
        />
        <p className="text-sm text-slate-400">
          {100 - currentNote.subject.length} characters left
        </p>
      </div>
      <div className="spaec-y-2">
        <label className="text-sm font-medium text-slate-200">Body</label>
        <textarea
          minLength={1}
          maxLength={3000}
          className="min-h-72 w-full resize-y rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-base text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
          onChange={(e) => {
            setCurrentNote({ ...currentNote, body: e.target.value });
            setErrors("");
          }}
          disabled={isDisabled}
          value={currentNote.body}
        ></textarea>
        <p className="text-sm text-slate-400">
          {3000 - currentNote.body.length} characters left
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-slate-200">Tags</label>
            <button
              type="button"
              disabled={isDisabled || tagInputs.length >= 8}
              onClick={addTagInput}
              className="rounded-lg border border-sky-700 px-3 py-1 text-sm font-medium text-sky-200 transition hover:border-sky-500 hover:text-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Add tag
            </button>
          </div>
          <div className="space-y-2">
            {tagInputs.length ? (
              tagInputs.map((tag, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={20}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                    placeholder={`Tag ${index + 1}`}
                    value={tag}
                    disabled={isDisabled}
                    onChange={(e) => updateTagInput(index, e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => removeTagInput(index)}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-red-500 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950 px-3 py-4 text-sm text-slate-400">
                No tags added yet.
              </div>
            )}
          </div>
          <p className="text-sm text-slate-400">
            Add up to 8 tags. Empty rows are ignored.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Folder</label>
          <input
            maxLength={40}
            type="text"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
            placeholder="Projects"
            value={currentNote.folder}
            disabled={isDisabled}
            onChange={(e) => {
              setCurrentNote({ ...currentNote, folder: e.target.value });
              setErrors("");
            }}
          />
          <p className="text-sm text-slate-400">
            Optional folder for grouping notes
          </p>
        </div>
      </div>
      <label className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-200">
        <input
          type="checkbox"
          checked={currentNote.pinned}
          disabled={isDisabled}
          onChange={(e) => {
            setCurrentNote({ ...currentNote, pinned: e.target.checked });
            setErrors("");
          }}
          className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-400/40"
        />
        Pin this note so it stays near the top of the list
      </label>
      <button
        disabled={isDisabled}
        className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => {
          if (isEditMode) {
            editNote();
          } else {
            createNote();
          }
        }}
      >
        Submit
      </button>
      <button
        disabled={isDisabled}
        className="rounded-lg m-4 bg-sky-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => {
          navigate("/");
          setErrors("");
        }}
      >
        Back
      </button>
      <div>{errors}</div>
    </div>
  );
}

export default NoteEditor;
