import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { z } from "zod";
import { fetchPublicNote } from "../api";
import { getReadableDate } from "../utils";

type PublicNoteData = {
  subject: string;
  body: string;
  folder: string;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

function PublicNote() {
  const { publicId } = useParams();
  const [note, setNote] = useState<PublicNoteData | null>(null);
  const [message, setMessage] = useState("Loading shared note...");
  const parsedId = z.uuid().safeParse(publicId);
  const validPublicId = parsedId.success ? parsedId.data : null;

  useEffect(() => {
    if (!validPublicId) {
      return;
    }

    const publicNoteId = validPublicId;
    let cancelled = false;

    async function loadNote() {
      try {
        const result = await fetchPublicNote(publicNoteId);

        if (!result.ok) {
          if (!cancelled) {
            setMessage("This shared note could not be found.");
          }
          return;
        }

        const json = await result.json();

        if (!cancelled) {
          setNote(json);
          setMessage("");
        }
      } catch {
        if (!cancelled) {
          setMessage("Failed to load this shared note.");
        }
      }
    }

    loadNote();

    return () => {
      cancelled = true;
    };
  }, [validPublicId]);

  if (!validPublicId) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <p className="text-slate-300">This share link is invalid.</p>
        <Link
          to="/"
          className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 font-medium text-white transition hover:bg-sky-500"
        >
          Back to app
        </Link>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <p className="text-slate-300">{message}</p>
        <Link
          to="/"
          className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 font-medium text-white transition hover:bg-sky-500"
        >
          Back to app
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
          Shared note
        </span>
        {note.pinned ? (
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200">
            Pinned
          </span>
        ) : null}
        {note.folder ? (
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
            {note.folder}
          </span>
        ) : null}
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-slate-50">{note.subject}</h1>
        <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-slate-200">
          {note.body}
        </p>
      </div>

      {note.tags.length ? (
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="rounded-full bg-sky-500/15 px-2 py-1 text-xs font-medium text-sky-200"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="text-sm text-slate-400">
        Created {getReadableDate(note.createdAt)}. Updated{" "}
        {getReadableDate(note.updatedAt)}.
      </div>

      <Link
        to="/"
        className="inline-flex rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-100 transition hover:border-sky-400 hover:text-sky-200"
      >
        Back to app
      </Link>
    </div>
  );
}

export default PublicNote;
