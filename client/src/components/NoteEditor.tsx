import type { Mode, Note } from "../types";

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
  mode,
}: NoteEditorProps) {
  return (
    <div>
      <label htmlFor="">Subject</label>
      <input
        type="text"
        onChange={(e) => {
          setCurrentNote({ ...currentNote, subject: e.target.value });
          setErrors("");
        }}
        value={currentNote.subject}
      />
      <button disabled={submitDisabled}
        onClick={() => {
          setMode("home");
          resetCurrentNote();
          setErrors("");
        }}
      >
        Back
      </button>
      <br />
      <br />
      <label htmlFor="">Body</label>
      <textarea
        name=""
        id=""
        style={{ width: 200, height: 200 }}
        onChange={(e) => {
          setCurrentNote({ ...currentNote, body: e.target.value });
          setErrors("");
        }}
        value={currentNote.body}
      ></textarea>
      <br />
      <br />
      <button disabled={submitDisabled}
        onClick={() => {
          if (mode === "edit") {
            editNote();
          } else if (mode === "create") {
            createNote();
          }
        }}
      >
        Submit
      </button>
      <div>{errors}</div>
    </div>
  );
}

export default NoteEditor;
