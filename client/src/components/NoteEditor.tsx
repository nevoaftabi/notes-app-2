import { useNavigate, useParams } from "react-router";
import type { Mode, Note } from "../types";
import { useEffect } from "react";
import { z } from "zod";

type NoteEditorProps = {
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  currentNote: Note;
  createNote: () => void;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
  resetCurrentNote: () => void;
  errors: string;
  setErrors: React.Dispatch<React.SetStateAction<string>>;
  editNote: () => void;
  submitDisabled: boolean;
  fetchNoteById: (noteId: string) => void;
  isFetchingNote: boolean;
  mode: Mode;
};

function NoteEditor({
  setMode,
  resetCurrentNote,
  currentNote,
  setCurrentNote,
  editNote,
  createNote,
  submitDisabled,
  setErrors,
  errors,
  fetchNoteById,
  isFetchingNote,
  mode,
}: NoteEditorProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const isDisabled = isFetchingNote || submitDisabled;

  useEffect(() => {
    if (!id) return;

    const parsedId = z.uuid().safeParse(id);

    if (!parsedId.success) {
      navigate("/");
      return;
    }

    if (currentNote.id === parsedId.data) {
      return;
    }

    fetchNoteById(parsedId.data);
  }, [id, isEditMode, fetchNoteById, currentNote.id, navigate]);

  return (
    <div className="space-y-4 mx-auto mt-12 max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
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
          className="resize-none text-base text-slate-100 min-h-40 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2  placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
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
