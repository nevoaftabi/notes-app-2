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
  disableButtons
  
}: NoteItemProps) => {
  return (
    <>
      <div key={note.id}>
        <span>
          {note.subject} | {note.body}{" "}
          <button disabled={disableButtons} onClick={() => deleteNote(note.id)}>Delete</button>
          <button
            disabled={disableButtons}
            onClick={() => {
              setCurrentNote(note);
              setMode("edit");
            }}
          >
            Edit
          </button>
        </span>
      </div>
    </>
  );
};

export default NoteItem;
