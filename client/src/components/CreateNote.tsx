import type { Mode } from "../App";
import type { Note } from '../note';

export type CreateNoteProps = {
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  currentNote: Note;
  createNote: () => void;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
  resetCurrentNote: () => void;
  errors: string;
  setErrors: React.Dispatch<React.SetStateAction<string>>;
};

function CreateNote({
  setMode,
  currentNote,
  setCurrentNote,
  resetCurrentNote,
  createNote,
  setErrors,
  errors,
}: CreateNoteProps) {
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
      <button
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
      <button onClick={() => createNote()}>Submit</button>
      <div>{errors}</div>
    </div>
  );
}

export default CreateNote;