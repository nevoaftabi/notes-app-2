import Notes from "./components/Notes";
import NoteEditor from "./components/NoteEditor";
import { useNotes } from "./hooks/useNotes";
import { Route, Routes } from "react-router";

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
    isFetchingNote,
    fetchNoteById
  } = useNotes();

  return (
    <Routes>
      <Route
        path="/notes/new"
        element={
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
            fetchNoteById={fetchNoteById}
            isFetchingNote={isFetchingNote}
          />
        }
      />
      <Route
        path="/notes/:id/edit"
        element={
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
            fetchNoteById={fetchNoteById}
            isFetchingNote={isFetchingNote}
          />
        }
      />
      <Route
        path="/"
        element={
          <Notes
            disableButtons={disableButtons}
            errors={errors}
            setErrors={setErrors}
            deleteNote={deleteNote}
            loadingMessage={loadingMessage}
            notes={notes}
            setCurrentNote={setCurrentNote}
            setMode={setMode}
            resetCurrentNote={resetCurrentNote}
          />
        }
      />
    </Routes>
  // add catch-all route
    // {mode !== "home" ? (

    // ) : (

    // )}
    // </>
  );
}

export default App;
