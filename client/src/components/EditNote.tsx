import type { Note } from "../note";
import type { CreateNoteProps } from "./CreateNote";

type EditNoteProps = CreateNoteProps & {
  currentNote: Note;
  editNote: () => void;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note>>;
  setErrors: React.Dispatch<React.SetStateAction<string>>;
  resetCurrentNote: () => void;
  errors: string;
};

function EditNote({
  setMode,
  resetCurrentNote,
  currentNote,
  setCurrentNote,
  editNote,
  setErrors,
  errors,
}: EditNoteProps) {
  return (
    <div>
      <label htmlFor="">Subject</label>
      <input
        type="text"
        onChange={(e) =>
          setCurrentNote({ ...currentNote, subject: e.target.value })
        }
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
        onChange={(e) =>
          setCurrentNote({ ...currentNote, body: e.target.value })
        }
        value={currentNote.body}
      ></textarea>
      <br />
      <br />
      <button onClick={() => editNote()}>Submit</button>
      <div>{errors}</div>
    </div>
  );
}

export default EditNote;