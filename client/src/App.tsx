import Notes from "./components/Notes";
import NoteEditor from "./components/NoteEditor";
import { useNotes } from "./hooks/useNotes";

// Disable buttons while edit request in flight
// Program CSS for the home page

function App() {
  const {
    createNote,
    currentNote,
    deleteNote,
    editNote,
    errors,
    loadingMessage,
    mode,
    notes,
    resetCurrentNote,
    setCurrentNote,
    setErrors,
    setMode,
    submitDisabled,
    disableButtons,
  } = useNotes();

  return (
    <>
    
      {mode !== "home" ? (
        <NoteEditor
          createNote={createNote}
          currentNote={currentNote}
          editNote={editNote}
          errors={errors}
          submitDisabled={submitDisabled}
          mode={mode}
          resetCurrentNote={resetCurrentNote}
          setCurrentNote={setCurrentNote}
          setErrors={setErrors}
          setMode={setMode}
        />
      ) : (
        <Notes
          disableButtons={disableButtons}
          errors={errors}
          setErrors={setErrors}
          deleteNote={deleteNote}
          loadingMessage={loadingMessage}
          notes={notes}
          setCurrentNote={setCurrentNote}
          setMode={setMode}
        />
      )}
    </>
  );
}

export default App;
