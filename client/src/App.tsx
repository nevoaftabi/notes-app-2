// TODO:
// Add autosave
// Make delete optimistic
// When a user is deleted, all of their notes also have to be deleted
// Optimizations/bug fixes

// Add react router
// Simulate server errors

import Notes from "./components/Notes";
import NoteEditor from "./components/NoteEditor";
import { useNotes } from "./hooks/useNotes";

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
  } = useNotes();

  return (
    <>
      {mode !== "home" ? (
        <NoteEditor
          createNote={createNote}
          currentNote={currentNote}
          editNote={editNote}
          errors={errors}
          mode={mode}
          resetCurrentNote={resetCurrentNote}
          setCurrentNote={setCurrentNote}
          setErrors={setErrors}
          setMode={setMode}
        />
      ) : (
        <Notes
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
