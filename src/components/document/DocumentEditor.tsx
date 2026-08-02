"use client";

import { useRef, useState, type ChangeEvent } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useOthers,
  useThreads,
} from "@liveblocks/react/suspense";
import {
  useLiveblocksExtension,
  Toolbar,
  FloatingToolbar,
  FloatingThreads,
  FloatingComposer,
} from "@liveblocks/react-tiptap";
import { Thread } from "@liveblocks/react-ui";
import type { ThreadData } from "@liveblocks/client";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import { Table2, ImagePlus, MessageSquare, X, ArrowRight } from "lucide-react";
import { PlagiarismFlag } from "@/lib/tiptap/plagiarism-flag-mark";
import { AnnotateOnly } from "@/lib/tiptap/annotate-only-plugin";
import {
  saveDocumentContentAction,
  regenerateDocumentContentAction,
  uploadDocumentImageAction,
} from "@/lib/actions/document";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/auth/FormError";

import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-tiptap/styles.css";

// Nom interne du mark posé par Liveblocks sur le texte commenté (vérifié dans
// @liveblocks/react-tiptap/dist/types.js — non exporté publiquement par le package),
// utilisé pour retrouver la position d'un fil de discussion dans le document afin d'y
// faire défiler la vue depuis le panneau latéral.
const LIVEBLOCKS_COMMENT_MARK_TYPE = "liveblocksCommentMark";

export type DocumentEditorMode = "edit" | "annotate" | "read";

interface DocumentEditorProps {
  memoireId: string;
  mode: DocumentEditorMode;
  initialContent: string;
  canRegenerate?: boolean;
}

export function DocumentEditor({
  memoireId,
  mode,
  initialContent,
  canRegenerate = false,
}: DocumentEditorProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth" badgeLocation="bottom-left">
      <RoomProvider id={`memoire-${memoireId}`}>
        <ClientSideSuspense fallback={<EditorSkeleton />}>
          <EditorRoom
            memoireId={memoireId}
            mode={mode}
            initialContent={initialContent}
            canRegenerate={canRegenerate}
          />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function EditorSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border-neutral bg-surface-light p-8 text-sm text-ink-muted">
      Chargement du document…
    </div>
  );
}

function EditorRoom({
  memoireId,
  mode,
  initialContent,
  canRegenerate,
}: {
  memoireId: string;
  mode: DocumentEditorMode;
  initialContent: string;
  canRegenerate: boolean;
}) {
  const liveblocksExtension = useLiveblocksExtension({ initialContent });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { threads } = useThreads({ query: { resolved: false } });

  const editor = useEditor({
    extensions: [
      liveblocksExtension,
      StarterKit.configure({ undoRedo: false }),
      Highlight,
      Table.configure({ renderWrapper: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      PlagiarismFlag,
      ...(mode === "annotate" ? [AnnotateOnly] : []),
    ],
    editable: mode !== "read",
    immediatelyRender: false,
  });

  async function handleSave() {
    if (!editor) return;
    setIsSaving(true);
    setError(null);
    const result = await saveDocumentContentAction(memoireId, editor.getHTML());
    setIsSaving(false);
    if (result.error) setError(result.error);
  }

  async function handleRegenerate() {
    const confirmed = window.confirm(
      "Régénérer le document depuis le fichier PDF original ? Les commentaires et surlignages déjà déposés par le jury sur ce document seront supprimés.",
    );
    if (!confirmed) return;

    setIsRegenerating(true);
    setError(null);
    const result = await regenerateDocumentContentAction(memoireId);
    if (result.error) {
      setError(result.error);
      setIsRegenerating(false);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <PresenceAvatars />
        <div className="flex items-center gap-3">
          {canRegenerate ? (
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="text-xs font-medium text-ink-muted underline decoration-dotted hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRegenerating ? "Régénération…" : "Régénérer depuis le PDF original"}
            </button>
          ) : null}
          {mode === "edit" ? (
            <Button
              type="button"
              tone="light"
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <FormError message={error} /> : null}

      {mode === "edit" ? <EditFixedToolbar editor={editor} memoireId={memoireId} /> : null}

      {mode === "edit" ? <FloatingToolbar editor={editor} /> : null}
      {mode === "annotate" ? <AnnotateFloatingToolbar editor={editor} /> : null}

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-w-0 flex-1 rounded-2xl border border-border-neutral bg-surface-light p-6">
          <EditorContent editor={editor} className="tiptap-document" />
        </div>

        {/* Réserve la place de la colonne : le panneau réel est en position fixe (voir
            CommentsPanel) pour rester scrollable indépendamment du document, sans dépendre
            du scroll de <main> ni d'un contexte sticky ambigu selon la structure du layout. */}
        <div className="hidden lg:block lg:w-80 lg:shrink-0" aria-hidden="true" />
      </div>

      <CommentsPanel editor={editor} threads={threads} />

      {mode !== "read" ? (
        <>
          <FloatingThreads editor={editor} threads={threads} />
          <FloatingComposer editor={editor} />
        </>
      ) : null}
    </div>
  );
}

function EditFixedToolbar({ editor, memoireId }: { editor: Editor | null; memoireId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  function insertTable() {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  async function handleImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.set("image", file);
    const result = await uploadDocumentImageAction(memoireId, formData);
    setIsUploading(false);

    if (result.url) {
      editor.chain().focus().setImage({ src: result.url }).run();
    }
  }

  return (
    <Toolbar editor={editor}>
      <Toolbar.SectionHistory />
      <Toolbar.Separator />
      <Toolbar.Button name="Insérer un tableau" icon={<Table2 size={16} />} onClick={insertTable} />
      <Toolbar.Button
        name="Insérer une image"
        icon={<ImagePlus size={16} />}
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelected}
      />
    </Toolbar>
  );
}

function AnnotateFloatingToolbar({ editor }: { editor: Editor | null }) {
  return (
    <FloatingToolbar editor={editor}>
      <ToggleButton
        label="Surligner"
        isActive={editor?.isActive("highlight") ?? false}
        onToggle={() => editor?.chain().focus().toggleHighlight().run()}
      />
      <ToggleButton
        label="Souligner"
        isActive={editor?.isActive("underline") ?? false}
        onToggle={() => editor?.chain().focus().toggleUnderline().run()}
      />
      <Toolbar.Separator />
      <Toolbar.SectionCollaboration />
    </FloatingToolbar>
  );
}

function ToggleButton({
  label,
  isActive,
  onToggle,
}: {
  label: string;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onToggle}
      className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition ${
        isActive
          ? "bg-accent/15 text-accent-dark"
          : "text-ink-muted hover:bg-surface-neutral hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function scrollToCommentThread(editor: Editor | null, threadId: string) {
  if (!editor) return;

  let targetPos: number | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (targetPos !== null) return false;
    const hasMark = node.marks.some(
      (mark) => mark.type.name === LIVEBLOCKS_COMMENT_MARK_TYPE && mark.attrs.threadId === threadId,
    );
    if (hasMark) {
      targetPos = pos;
      return false;
    }
    return true;
  });

  if (targetPos === null) return;
  const dom = editor.view.nodeDOM(targetPos);
  const element = dom instanceof HTMLElement ? dom : dom?.parentElement;
  element?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function CommentsPanel({ editor, threads }: { editor: Editor | null; threads: ThreadData[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const label = `Commentaires${threads.length > 0 ? ` (${threads.length})` : ""}`;

  function goToThread(threadId: string) {
    scrollToCommentThread(editor, threadId);
    setMobileOpen(false);
  }

  const list = (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
      {threads.length === 0 ? (
        <p className="px-1 py-2 text-sm text-ink-muted">Aucun commentaire sur ce document.</p>
      ) : (
        threads.map((thread) => (
          <div
            key={thread.id}
            className="shrink-0 overflow-hidden rounded-xl border border-border-neutral bg-surface-light"
          >
            <button
              type="button"
              onClick={() => goToThread(thread.id)}
              className="flex w-full items-center gap-1.5 border-b border-border-neutral bg-surface-neutral/60 px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:text-ink"
            >
              <ArrowRight size={12} />
              Voir dans le texte
            </button>
            <Thread thread={thread} showComposer="collapsed" />
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full border border-border-neutral bg-surface-light px-4 py-2.5 text-sm font-medium text-ink shadow-lg lg:hidden"
      >
        <MessageSquare size={16} />
        {label}
      </button>

      {/* Position fixe (et non sticky) : indépendante du scroll de <main> et de la
          structure de layout parente, pour garantir un panneau qui reste à l'écran et
          scroll séparément du document, quoi qu'il arrive au-dessus dans l'arbre. */}
      <aside className="hidden lg:fixed lg:top-24 lg:right-6 lg:bottom-6 lg:z-30 lg:flex lg:w-80 lg:flex-col lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border-neutral lg:bg-surface-light lg:shadow-lg">
        <div className="shrink-0 border-b border-border-neutral px-4 py-3 text-sm font-medium text-ink">
          {label}
        </div>
        {list}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 flex justify-end lg:hidden">
          <button
            type="button"
            aria-label="Fermer le panneau de commentaires"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="relative flex h-full w-80 max-w-[85vw] flex-col bg-surface-light shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border-neutral px-4 py-3">
              <span className="text-sm font-medium text-ink">{label}</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-ink-muted hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            {list}
          </div>
        </div>
      ) : null}
    </>
  );
}

function PresenceAvatars() {
  const others = useOthers();
  if (others.length === 0) return null;

  return (
    <div className="flex -space-x-2">
      {others.slice(0, 5).map((other) => (
        <div
          key={other.connectionId}
          title={typeof other.info?.name === "string" ? other.info.name : "Utilisateur"}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-light bg-accent/20 text-xs font-medium text-accent-dark"
        >
          {(typeof other.info?.name === "string" ? other.info.name : "?").slice(0, 1).toUpperCase()}
        </div>
      ))}
    </div>
  );
}
