export type Note = {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type EditNoteRequest = {
  id: string;
  subject: string;
  body: string;
}

export type Mode = "home" | "edit" | "create";