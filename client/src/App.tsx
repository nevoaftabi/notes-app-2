import Notes from "./components/Notes";
import NoteEditor from "./components/NoteEditor";
import { useNotes } from "./hooks/useNotes";
import { Navigate, Route, Routes } from "react-router";

function App() {
  const {
    createNote,
    currentNote,
    deleteNote,
    editNote,
    errors,
    loadingMessage,
    notes,
    resetCurrentNote,
    setCurrentNote,
    setErrors,
    submitDisabled,
    disableButtons,
    isFetchingNote,
    fetchNoteById,
    storageMode,
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
            setCurrentNote={setCurrentNote}
            setErrors={setErrors}
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
            setCurrentNote={setCurrentNote}
            setErrors={setErrors}
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
            resetCurrentNote={resetCurrentNote}
            storageMode={storageMode}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
