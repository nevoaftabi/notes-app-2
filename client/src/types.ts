export type Note = {
  id: string;
  subject: string;
  body: string;
  tags: string[];
  folder: string;
  pinned: boolean;
  isPublic: boolean;
  publicId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EditNoteRequest = {
  id: string;
  subject: string;
  body: string;
  tags: string[];
  folder: string;
  pinned: boolean;
};

export function createEmptyNote(): Note {
  return {
    id: "",
    subject: "",
    body: "",
    tags: [],
    folder: "",
    pinned: false,
    isPublic: false,
    publicId: null,
    deletedAt: null,
    createdAt: "",
    updatedAt: "",
  };
}
