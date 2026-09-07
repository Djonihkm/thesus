"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import useYProvider from "y-partykit/react";
import { useEditor, useEditorState, EditorContent, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { TextStyle, FontFamily, FontSize } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { undoCommand, redoCommand } from "y-prosemirror";
import {
  Table2,
  ImagePlus,
  MessageSquare,
  Sparkles,
  X,
  ArrowRight,
  ArrowDownToLine,
  Send,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ScissorsLineDashed,
  Minus,
  Download,
  Loader2,
  Check,
  CheckCircle2,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  Trash2,
} from "lucide-react";
import { PlagiarismFlag } from "@/lib/tiptap/plagiarism-flag-mark";
import { AnnotateOnly } from "@/lib/tiptap/annotate-only-plugin";
import { PageBreak } from "@/lib/tiptap/page-break";
import { ResizableImage } from "@/lib/tiptap/resizable-image";
import { CollaborativeEditing } from "@/lib/tiptap/collaborative-editing";
import {
  useConnectionStatus,
  usePresence,
  usePresenceSetter,
} from "@/lib/tiptap/use-collaboration-provider";
import { DocumentCommentMark } from "@/lib/tiptap/document-comment-mark";
import { encodeCommentAnchor, decodeCommentAnchor } from "@/lib/tiptap/comment-anchor";
import { findTextRangeInDoc } from "@/lib/tiptap/find-text-range";
import { documentRoomId, getPartyKitHost } from "@/lib/partykit";
import {
  saveDocumentContentAction,
  regenerateDocumentContentAction,
  uploadDocumentImageAction,
} from "@/lib/actions/document";
import {
  getDocumentCommentsAction,
  createDocumentCommentAction,
  replyToDocumentCommentAction,
  resolveDocumentCommentAction,
  deleteDocumentCommentAction,
  type DocumentCommentView,
  type DocumentCommentReplyView,
} from "@/lib/actions/document-comments";
import { sendAiChatMessageAction, type ChatMessageView } from "@/lib/actions/ai-chat";
import { escapeHtml } from "@/lib/html";
import { FormError } from "@/components/auth/FormError";

// Jeu de polices volontairement limité aux classiques web-safe (rendu identique dans
// l'éditeur, le PDF Adobe et le DOCX généré) — pas de Google Fonts, dont la disponibilité
// n'est pas garantie côté moteur de rendu Adobe ni dans Word à l'ouverture.
const FONT_FAMILIES = [
  { label: "Par défaut", value: "" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
] as const;

const FONT_SIZES = [
  { label: "Par défaut", value: "" },
  { label: "10", value: "10pt" },
  { label: "11", value: "11pt" },
  { label: "12", value: "12pt" },
  { label: "14", value: "14pt" },
  { label: "16", value: "16pt" },
  { label: "18", value: "18pt" },
  { label: "20", value: "20pt" },
  { label: "24", value: "24pt" },
  { label: "28", value: "28pt" },
] as const;

export type DocumentEditorMode = "edit" | "annotate" | "read";

interface DocumentEditorProps {
  memoireId: string;
  documentRoomVersion: number;
  userName: string;
  mode: DocumentEditorMode;
  initialContent: string;
  canRegenerate?: boolean;
  // Chat IA : uniquement pertinent en mode "edit" (étudiant sur son propre mémoire) — pas de
  // chat côté jury dans cette itération, voir la note sur showChat plus bas.
  initialChatMessages?: ChatMessageView[];
  // Calculé côté serveur (voir isDocumentContextTruncated dans lib/ai-chat.ts, pas
  // importable ici — ce fichier est "use client") à partir du même editableContent que
  // initialContent : signale que l'assistant IA ne voit qu'un extrait (début + fin) du
  // document, pas son intégralité, pour l'afficher dans le panneau de chat.
  documentContextTruncated?: boolean;
  // Extrait à repérer et marquer (plagiarismFlag) au chargement — voir find-text-range.ts.
  // Vient du bouton "Marquer dans le document" du rapport anti-plagiat (plagiat/page.tsx),
  // jamais appliqué automatiquement à l'ouverture normale du document.
  flagExcerptOnLoad?: string;
}

type PanelTab = "comments" | "chat";

const PANEL_COLLAPSED_STORAGE_KEY = "thesus-document-panel-collapsed";

export function DocumentEditor({
  memoireId,
  documentRoomVersion,
  userName,
  mode,
  initialContent,
  canRegenerate = false,
  initialChatMessages = [],
  documentContextTruncated = false,
  flagExcerptOnLoad,
}: DocumentEditorProps) {
  const docId = useMemo(
    () => documentRoomId(memoireId, documentRoomVersion),
    [memoireId, documentRoomVersion],
  );

  // Récupère le jeton signé par /api/party-auth (session, appartenance du mémoire,
  // canAccessMemoireDocument — voir ce fichier) avant que le provider n'ouvre la connexion
  // WebSocket : jamais de room accessible par simple connaissance de son ID, voir
  // party/document.ts:onBeforeConnect qui revérifie ce jeton côté serveur.
  const fetchPartyToken = useCallback(async () => {
    const response = await fetch("/api/party-auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ docId }),
    });
    if (!response.ok) throw new Error("Échec de l'authentification au document.");
    const { token } = (await response.json()) as { token: string };
    return { token };
  }, [docId]);

  const provider = useYProvider({
    host: getPartyKitHost(),
    room: docId,
    options: { params: fetchPartyToken },
  });

  const awareness = provider.awareness;
  const connectionStatus = useConnectionStatus(provider);
  const fragment = useMemo(() => provider.doc.getXmlFragment("default"), [provider]);

  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "docx" | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // true dès qu'une frappe survient, false seulement après une sauvegarde réussie — distinct
  // de saveStatus, qui ne reflète que le dernier appel déclenché, pas "il reste une frappe en
  // attente du debounce". Sert au garde-fou de fermeture d'onglet ci-dessous.
  const hasUnsavedChangesRef = useRef(false);

  const [comments, setComments] = useState<DocumentCommentView[]>([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  // Alimenté par goToComment ci-dessous quand le passage ancré a été supprimé du document —
  // sans ça, "Voir dans le texte" échouait silencieusement (aucun scroll, aucune indication),
  // laissant un commentaire orphelin indéfiniment sans que personne ne sache pourquoi le
  // retrouver ne marchait plus.
  const [unresolvedCommentIds, setUnresolvedCommentIds] = useState<Set<string>>(new Set());

  // Le chat IA est réservé à l'étudiant sur son propre document (mode "edit" — annotate est
  // le jury, read n'a pas d'édition possible) : pas d'équivalent côté jury dans cette
  // itération.
  const showChat = mode === "edit";
  const [activeTab, setActiveTab] = useState<PanelTab>("comments");
  const [mobileOpen, setMobileOpen] = useState(false);

  function openChatPanel() {
    setActiveTab("chat");
    setMobileOpen(true);
  }

  // Repli du panneau latéral, mémorisé pour ne pas avoir à le refermer à chaque chargement
  // de page si l'étudiant préfère le garder replié. Toujours déplié au tout premier rendu
  // (identique au HTML serveur) puis lu depuis localStorage après montage — lire dans
  // l'initialiseur de useState ferait diverger le premier rendu client du HTML serveur
  // (mismatch d'hydratation React, voir le même correctif sur Sidebar.tsx).
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  useEffect(() => {
    // Différé (queueMicrotask), même raison que le correctif équivalent dans Sidebar.tsx.
    queueMicrotask(() => {
      if (window.localStorage.getItem(PANEL_COLLAPSED_STORAGE_KEY) === "true") {
        setIsPanelCollapsed(true);
      }
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PANEL_COLLAPSED_STORAGE_KEY, String(isPanelCollapsed));
  }, [isPanelCollapsed]);

  const editor = useEditor(
    {
      extensions: [
        CollaborativeEditing.configure({ fragment, awareness }),
        StarterKit.configure({ undoRedo: false }),
        Highlight,
        Underline,
        TextStyle,
        FontFamily,
        FontSize,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        PageBreak,
        Table.configure({ renderWrapper: true }),
        TableRow,
        TableHeader,
        TableCell,
        ResizableImage,
        PlagiarismFlag,
        DocumentCommentMark,
        ...(mode === "annotate" ? [AnnotateOnly] : []),
      ],
      editable: mode !== "read",
      immediatelyRender: false,
    },
    [fragment, awareness],
  );

  // Amorce le document avec le contenu déjà enregistré (mammoth/squelette de brouillon) la
  // toute première fois qu'il est ouvert — seul le mode "edit" (l'étudiant propriétaire)
  // amorce, pour ne jamais risquer une double amorce si étudiant et jury ouvrent le document
  // au même moment. setContent passe par une transaction normale, que le plugin de
  // synchronisation Yjs répercute vers le document partagé comme n'importe quelle frappe.
  const hasSeededRef = useRef(false);
  useEffect(() => {
    if (!editor || mode !== "edit" || hasSeededRef.current) return;
    if (connectionStatus !== "connected") return;

    hasSeededRef.current = true;
    if (fragment.length === 0 && initialContent) {
      // setContent déclenche un flushSync interne (TipTap/ProseMirror) — inacceptable tant
      // que React est encore en train de committer cet effet. queueMicrotask le repousse
      // juste après, une fois le rendu terminé.
      queueMicrotask(() => editor.commands.setContent(initialContent));
    }
  }, [editor, mode, connectionStatus, fragment, initialContent]);

  // Marque le passage signalé par le rapport anti-plagiat (voir find-text-range.ts) une fois
  // le document chargé — recherche par contenu, peut échouer si le texte a changé depuis
  // l'analyse ; l'échec est alors signalé explicitement (flagResult "not-found"), jamais
  // silencieux.
  const hasAppliedFlagRef = useRef(false);
  const [flagResult, setFlagResult] = useState<"found" | "not-found" | null>(null);
  useEffect(() => {
    if (!editor || !flagExcerptOnLoad || hasAppliedFlagRef.current) return;
    if (connectionStatus !== "connected") return;

    hasAppliedFlagRef.current = true;
    queueMicrotask(() => {
      const range = findTextRangeInDoc(editor.state.doc, flagExcerptOnLoad);
      if (!range) {
        setFlagResult("not-found");
        return;
      }
      editor.chain().setTextSelection(range).setMark("plagiarismFlag").run();
      const domInfo = editor.view.domAtPos(range.from);
      const element = domInfo.node instanceof HTMLElement ? domInfo.node : domInfo.node.parentElement;
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlagResult("found");
    });
  }, [editor, connectionStatus, flagExcerptOnLoad]);

  // Présence : nom réel depuis la session NextAuth (passé en prop depuis la page serveur),
  // plus besoin d'un resolveUsers séparé comme avec Liveblocks.
  const setPresence = usePresenceSetter<{ name: string }>(awareness);
  useEffect(() => {
    setPresence({ name: userName });
  }, [setPresence, userName]);
  const others = usePresence<{ name: string }>(awareness);

  useEffect(() => {
    let cancelled = false;
    getDocumentCommentsAction(memoireId).then((result) => {
      if (!cancelled && "comments" in result) setComments(result.comments);
    });
    return () => {
      cancelled = true;
    };
  }, [memoireId]);

  const performSave = useCallback(async () => {
    if (!editor) return;
    setSaveStatus("saving");
    const result = await saveDocumentContentAction(memoireId, editor.getHTML());
    setSaveStatus(result.error ? "error" : "saved");
    if (!result.error) hasUnsavedChangesRef.current = false;
  }, [editor, memoireId]);

  // Sauvegarde automatique façon Google Docs : un court silence après la dernière frappe
  // déclenche l'enregistrement, plutôt qu'un bouton manuel — seul le mode "edit" (l'étudiant
  // propriétaire) peut écrire dans Memoire.editableContent, voir saveDocumentContentAction.
  useEffect(() => {
    if (!editor || mode !== "edit") return;

    function scheduleSave() {
      hasUnsavedChangesRef.current = true;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        void performSave();
      }, 1500);
    }

    editor.on("update", scheduleSave);
    return () => {
      editor.off("update", scheduleSave);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [editor, mode, performSave]);

  // Filet pour la frappe qui tombe dans la fenêtre du debounce (jusqu'à 1500ms) au moment où
  // l'étudiant ferme l'onglet ou navigue ailleurs : on tente un enregistrement immédiat dès
  // que la page devient masquée (déclenché de façon fiable sur mobile, contrairement à
  // beforeunload) et on avertit via le dialogue natif du navigateur s'il reste une
  // sauvegarde en attente au moment de quitter — pas une garantie absolue (un flush
  // asynchrone pendant beforeunload peut être interrompu), mais réduit nettement la fenêtre
  // de perte silencieuse par rapport à l'absence totale de filet.
  useEffect(() => {
    if (!editor || mode !== "edit") return;

    function flushPendingSave() {
      if (!hasUnsavedChangesRef.current) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      void performSave();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") flushPendingSave();
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChangesRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [editor, mode, performSave]);

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

  // Enregistre d'abord le contenu actuel de l'éditeur, pour que le fichier téléchargé
  // reflète exactement ce qui est affiché — pas seulement la dernière version déjà
  // enregistrée. Le navigateur gère ensuite le téléchargement lui-même (réponse en
  // Content-Disposition: attachment) : impossible de détecter sa fin depuis ce contexte, on
  // relâche donc l'état "en cours" après un court délai plutôt que de bloquer le bouton.
  async function handleExport(format: "pdf" | "docx") {
    if (!editor || exportingFormat) return;
    setExportingFormat(format);
    setError(null);

    // Seul le mode "edit" (l'étudiant propriétaire) peut enregistrer — en mode "annotate"
    // (jury) ou "read", saveDocumentContentAction refuserait de toute façon (pas le
    // propriétaire) : l'export part directement du contenu déjà enregistré en base.
    if (mode === "edit") {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setSaveStatus("saving");
      const saveResult = await saveDocumentContentAction(memoireId, editor.getHTML());
      if (saveResult.error) {
        setSaveStatus("error");
        setError(saveResult.error);
        setExportingFormat(null);
        return;
      }
      setSaveStatus("saved");
    }

    window.location.href = `/api/memoires/${memoireId}/export/${format}`;
    setTimeout(() => setExportingFormat(null), 3000);
  }

  async function handleSubmitComment(content: string) {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const anchor = encodeCommentAnchor(editor, from, to);

    const result = await createDocumentCommentAction(memoireId, content, anchor);
    setIsComposerOpen(false);
    if (result.error || !result.comment) {
      setError(result.error ?? "Échec de l'ajout du commentaire.");
      return;
    }

    setComments((current) => [...current, result.comment!]);
    editor
      .chain()
      .setTextSelection({ from, to })
      .setDocumentComment({ commentId: result.comment.id })
      .run();
  }

  async function handleReply(parentId: string, content: string) {
    const result = await replyToDocumentCommentAction(memoireId, parentId, content);
    if (result.error || !result.reply) {
      setError(result.error ?? "Échec de l'envoi de la réponse.");
      return;
    }
    const reply = result.reply;
    setComments((current) =>
      current.map((comment) =>
        comment.id === parentId ? { ...comment, replies: [...comment.replies, reply] } : comment,
      ),
    );
  }

  async function handleResolve(commentId: string) {
    const result = await resolveDocumentCommentAction(memoireId, commentId, true);
    if (result.error) {
      setError(result.error);
      return;
    }
    setComments((current) => current.filter((comment) => comment.id !== commentId));
    editor?.chain().unsetDocumentCommentById(commentId).run();
  }

  async function handleDelete(commentId: string, isRoot: boolean) {
    const result = await deleteDocumentCommentAction(memoireId, commentId);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (isRoot) {
      setComments((current) => current.filter((comment) => comment.id !== commentId));
      editor?.chain().unsetDocumentCommentById(commentId).run();
    } else {
      setComments((current) =>
        current.map((comment) => ({
          ...comment,
          replies: comment.replies.filter((reply) => reply.id !== commentId),
        })),
      );
    }
  }

  function goToComment(comment: DocumentCommentView) {
    if (!editor || !comment.anchorFrom || !comment.anchorTo) return;
    const range = decodeCommentAnchor(editor, {
      anchorFrom: comment.anchorFrom,
      anchorTo: comment.anchorTo,
    });
    if (!range) {
      setUnresolvedCommentIds((current) => new Set(current).add(comment.id));
      return;
    }
    setUnresolvedCommentIds((current) => {
      if (!current.has(comment.id)) return current;
      const next = new Set(current);
      next.delete(comment.id);
      return next;
    });
    const domInfo = editor.view.domAtPos(range.from);
    const element = domInfo.node instanceof HTMLElement ? domInfo.node : domInfo.node.parentElement;
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="flex flex-col gap-4">
      {flagResult ? (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm ${
            flagResult === "found" ? "bg-flag-soft text-flag" : "bg-surface-neutral text-ink-muted"
          }`}
        >
          <span>
            {flagResult === "found"
              ? "Le passage signalé a été repéré et marqué dans le document."
              : "Le passage signalé n'a pas été retrouvé tel quel dans le document — il a peut-être été modifié depuis l'analyse anti-plagiat."}
          </span>
          <button
            type="button"
            onClick={() => setFlagResult(null)}
            aria-label="Fermer"
            className="shrink-0 opacity-70 transition hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <PresenceAvatars others={others} />
          {mode === "edit" ? <SaveStatusIndicator status={saveStatus} /> : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
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

          <button
            type="button"
            onClick={() => handleExport("pdf")}
            disabled={exportingFormat !== null}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink transition hover:bg-surface-neutral disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exportingFormat === "pdf" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Download size={13} />
            )}
            PDF
          </button>
          <button
            type="button"
            onClick={() => handleExport("docx")}
            disabled={exportingFormat !== null}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink transition hover:bg-surface-neutral disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exportingFormat === "docx" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Download size={13} />
            )}
            DOCX
          </button>
        </div>
      </div>

      {error ? <FormError message={error} /> : null}

      {/* Cadre à hauteur contrainte, indépendant du scroll de la page : la barre d'outils
          (première section, non scrollable) reste donc visible en permanence, seul le
          contenu du document défile dans son propre overflow-y ci-dessous. min-h-0 sur
          l'enfant flex-1 est nécessaire (même piège que le panneau de commentaires) : sans
          ça, un flex-col laisse son enfant grandir avec son contenu au lieu de le contraindre
          à la hauteur disponible, et overflow-y-auto n'a alors plus rien à faire. */}
      <div className="flex h-[calc(100vh-19rem)] min-h-105 flex-col overflow-hidden rounded-2xl border border-border-neutral bg-surface-light">
        {mode === "edit" ? (
          <div className="shrink-0 border-b border-border-neutral">
            <EditFixedToolbar editor={editor} memoireId={memoireId} onOpenChat={openChatPanel} />
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <EditorContent editor={editor} className="tiptap-document" />
        </div>
      </div>

      {mode !== "read" ? (
        <SelectionBubbleMenu
          editor={editor}
          mode={mode}
          isComposerOpen={isComposerOpen}
          onOpenComposer={() => setIsComposerOpen(true)}
          onCancelComposer={() => setIsComposerOpen(false)}
          onSubmitComment={handleSubmitComment}
        />
      ) : null}

      {/* Réserve la place de la colonne à droite pour ne pas passer sous le panneau latéral
          (en position fixe, voir EditorSidePanel) — largeur synchronisée avec son état
          replié/déplié pour que le document profite réellement de l'espace libéré. */}
      <div
        className={`hidden lg:block lg:shrink-0 ${isPanelCollapsed ? "lg:w-14" : "lg:w-80"}`}
        aria-hidden="true"
      />

      <EditorSidePanel
        editor={editor}
        comments={comments}
        unresolvedCommentIds={unresolvedCommentIds}
        currentUserName={userName}
        showChat={showChat}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        isCollapsed={isPanelCollapsed}
        onCollapsedChange={setIsPanelCollapsed}
        memoireId={memoireId}
        initialChatMessages={initialChatMessages}
        documentContextTruncated={documentContextTruncated}
        onNavigateToComment={goToComment}
        onReply={handleReply}
        onResolve={handleResolve}
        onDelete={handleDelete}
      />
    </div>
  );
}

function SaveStatusIndicator({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "idle") return null;

  if (status === "saving") {
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-muted">
        <Loader2 size={12} className="animate-spin" />
        Enregistrement…
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-xs text-flag">
        <CircleAlert size={12} />
        Erreur d&apos;enregistrement
      </span>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-muted">
      <Check size={12} className="text-accent-dark" />
      Enregistré
    </span>
  );
}

// Bouton d'icône compact partagé par la barre d'outils fixe et les menus flottants —
// remplace les primitives de mise en forme (Toolbar.Button/Toolbar.Toggle) qui venaient
// jusqu'ici de @liveblocks/react-tiptap.
function ToolbarIconButton({
  label,
  icon,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-accent/15 text-accent-dark" : "text-ink-muted hover:bg-surface-neutral hover:text-ink"
      }`}
    >
      {icon}
    </button>
  );
}

function ToolbarSeparator() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-border-neutral" aria-hidden="true" />;
}

const ALIGN_BUTTONS = [
  { value: "left", icon: AlignLeft, label: "Aligner à gauche" },
  { value: "center", icon: AlignCenter, label: "Centrer" },
  { value: "right", icon: AlignRight, label: "Aligner à droite" },
  { value: "justify", icon: AlignJustify, label: "Justifier" },
] as const;

function EditFixedToolbar({
  editor,
  memoireId,
  onOpenChat,
}: {
  editor: Editor | null;
  memoireId: string;
  onOpenChat: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { fontFamily, fontSize, textAlign, canUndo, canRedo } = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      fontFamily: currentEditor?.isActive("textStyle")
        ? ((currentEditor.getAttributes("textStyle").fontFamily as string | undefined) ?? "")
        : "",
      fontSize: currentEditor?.isActive("textStyle")
        ? ((currentEditor.getAttributes("textStyle").fontSize as string | undefined) ?? "")
        : "",
      textAlign:
        (["left", "center", "right", "justify"] as const).find((align) =>
          currentEditor?.isActive({ textAlign: align }),
        ) ?? "left",
      canUndo: currentEditor ? undoCommand(currentEditor.state) : false,
      canRedo: currentEditor ? redoCommand(currentEditor.state) : false,
    }),
  }) ?? { fontFamily: "", fontSize: "", textAlign: "left" as const, canUndo: false, canRedo: false };

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
    <div className="flex flex-wrap items-center gap-1 px-3 py-2">
      <ToolbarIconButton
        label="Annuler"
        icon={<Undo2 size={16} />}
        disabled={!canUndo}
        onClick={() => editor && undoCommand(editor.state, editor.view.dispatch)}
      />
      <ToolbarIconButton
        label="Rétablir"
        icon={<Redo2 size={16} />}
        disabled={!canRedo}
        onClick={() => editor && redoCommand(editor.state, editor.view.dispatch)}
      />
      <ToolbarSeparator />

      <select
        aria-label="Police"
        value={fontFamily}
        onChange={(event) => {
          const value = event.target.value;
          if (value) editor?.chain().focus().setFontFamily(value).run();
          else editor?.chain().focus().unsetFontFamily().run();
        }}
        className="h-8 rounded-md border border-ink/15 bg-surface-light px-2 text-xs text-ink outline-none focus:border-accent"
      >
        {FONT_FAMILIES.map((font) => (
          <option key={font.label} value={font.value} style={{ fontFamily: font.value || undefined }}>
            {font.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Taille du texte"
        value={fontSize}
        onChange={(event) => {
          const value = event.target.value;
          if (value) editor?.chain().focus().setFontSize(value).run();
          else editor?.chain().focus().unsetFontSize().run();
        }}
        className="h-8 rounded-md border border-ink/15 bg-surface-light px-2 text-xs text-ink outline-none focus:border-accent"
      >
        {FONT_SIZES.map((size) => (
          <option key={size.label} value={size.value}>
            {size.label}
          </option>
        ))}
      </select>

      <ToolbarSeparator />

      {ALIGN_BUTTONS.map((align) => (
        <ToolbarIconButton
          key={align.value}
          label={align.label}
          icon={<align.icon size={16} />}
          active={textAlign === align.value}
          onClick={() => editor?.chain().focus().setTextAlign(align.value).run()}
        />
      ))}

      <ToolbarSeparator />

      <ToolbarIconButton label="Insérer un tableau" icon={<Table2 size={16} />} onClick={insertTable} />
      <ToolbarIconButton
        label="Insérer une image"
        icon={<ImagePlus size={16} />}
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      />
      <ToolbarIconButton
        label="Ligne horizontale"
        icon={<Minus size={16} />}
        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
      />
      <ToolbarIconButton
        label="Saut de page"
        icon={<ScissorsLineDashed size={16} />}
        onClick={() => editor?.chain().focus().setPageBreak().run()}
      />

      <ToolbarSeparator />
      <ToolbarIconButton label="Assistant IA" icon={<Sparkles size={16} />} onClick={onOpenChat} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelected}
      />
    </div>
  );
}

// Menu flottant sur sélection de texte — remplace le FloatingToolbar de
// @liveblocks/react-tiptap. Contenu différent selon le mode : mise en forme de base en
// édition (l'étudiant), surlignage/soulignage en annotation (le jury) — mais le bouton
// Commenter est disponible dans les deux, même déclenchement qu'avant.
function SelectionBubbleMenu({
  editor,
  mode,
  isComposerOpen,
  onOpenComposer,
  onCancelComposer,
  onSubmitComment,
}: {
  editor: Editor | null;
  mode: DocumentEditorMode;
  isComposerOpen: boolean;
  onOpenComposer: () => void;
  onCancelComposer: () => void;
  onSubmitComment: (content: string) => void;
}) {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ state }) => !state.selection.empty}
      updateDelay={100}
    >
      <div className="flex items-center gap-0.5 rounded-lg border border-border-neutral bg-surface-light p-1 shadow-lg shadow-ink/10">
        {isComposerOpen ? (
          <CommentComposer onSubmit={onSubmitComment} onCancel={onCancelComposer} />
        ) : (
          <>
            {mode === "edit" ? (
              <>
                <ToolbarIconButton
                  label="Gras"
                  icon={<Bold size={15} />}
                  active={editor.isActive("bold")}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                />
                <ToolbarIconButton
                  label="Italique"
                  icon={<Italic size={15} />}
                  active={editor.isActive("italic")}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                />
                <ToolbarIconButton
                  label="Souligner"
                  icon={<UnderlineIcon size={15} />}
                  active={editor.isActive("underline")}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                />
                <ToolbarIconButton
                  label="Barré"
                  icon={<Strikethrough size={15} />}
                  active={editor.isActive("strike")}
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                />
              </>
            ) : (
              <>
                <ToggleButton
                  label="Surligner"
                  isActive={editor.isActive("highlight")}
                  onToggle={() => editor.chain().focus().toggleHighlight().run()}
                />
                <ToggleButton
                  label="Souligner"
                  isActive={editor.isActive("underline")}
                  onToggle={() => editor.chain().focus().toggleUnderline().run()}
                />
              </>
            )}
            <ToolbarSeparator />
            <ToolbarIconButton
              label="Commenter"
              icon={<MessageSquare size={15} />}
              onClick={onOpenComposer}
            />
          </>
        )}
      </div>
    </BubbleMenu>
  );
}

function CommentComposer({
  onSubmit,
  onCancel,
}: {
  onSubmit: (content: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <div className="flex w-72 flex-col gap-2 p-1.5">
      <textarea
        autoFocus
        rows={3}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
        placeholder="Ajouter un commentaire…"
        className="resize-none rounded-md border border-ink/15 bg-surface-light p-2 text-sm text-ink outline-none focus:border-accent"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-surface-neutral hover:text-ink"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim()}
          className="rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Commenter
        </button>
      </div>
    </div>
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

const relativeTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function CommentBubble({
  comment,
  currentUserName,
  onDelete,
}: {
  comment: DocumentCommentView | DocumentCommentReplyView;
  currentUserName: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-ink">{comment.authorName}</span>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[11px] text-ink-muted">
            {relativeTimeFormatter.format(new Date(comment.createdAt))}
          </span>
          {comment.authorName === currentUserName ? (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Supprimer le commentaire"
              className="text-ink-muted transition hover:text-flag"
            >
              <Trash2 size={12} />
            </button>
          ) : null}
        </div>
      </div>
      <p className="text-sm whitespace-pre-wrap text-ink">{comment.content}</p>
    </div>
  );
}

function ReplyComposer({ onSubmit }: { onSubmit: (content: string) => void }) {
  const [value, setValue] = useState("");

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <div className="flex items-end gap-2 border-t border-border-neutral pt-2">
      <textarea
        rows={1}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder="Répondre…"
        className="min-h-0 flex-1 resize-none rounded-lg border border-ink/15 bg-surface-light px-2.5 py-1.5 text-xs text-ink outline-none focus:border-accent"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!value.trim()}
        aria-label="Envoyer la réponse"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send size={12} />
      </button>
    </div>
  );
}

function CommentsList({
  comments,
  unresolvedCommentIds,
  currentUserName,
  onNavigate,
  onReply,
  onResolve,
  onDelete,
}: {
  comments: DocumentCommentView[];
  unresolvedCommentIds: Set<string>;
  currentUserName: string;
  onNavigate: (comment: DocumentCommentView) => void;
  onReply: (parentId: string, content: string) => void;
  onResolve: (commentId: string) => void;
  onDelete: (commentId: string, isRoot: boolean) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
      {comments.length === 0 ? (
        <p className="px-1 py-2 text-sm text-ink-muted">Aucun commentaire sur ce document.</p>
      ) : (
        comments.map((comment) => {
          const isUnresolved = unresolvedCommentIds.has(comment.id);
          return (
          <div
            key={comment.id}
            className="shrink-0 overflow-hidden rounded-xl border border-border-neutral bg-surface-light"
          >
            <div className="flex items-center justify-between gap-1.5 border-b border-border-neutral bg-surface-neutral/60 px-3 py-1.5">
              <button
                type="button"
                onClick={() => onNavigate(comment)}
                disabled={!comment.anchorFrom || isUnresolved}
                className="flex items-center gap-1.5 text-xs font-medium text-ink-muted transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowRight size={12} />
                Voir dans le texte
              </button>
              <button
                type="button"
                onClick={() => onResolve(comment.id)}
                aria-label="Marquer comme résolu"
                title="Marquer comme résolu"
                className="text-ink-muted transition hover:text-accent-dark"
              >
                <CheckCircle2 size={14} />
              </button>
            </div>
            {isUnresolved ? (
              <p className="border-b border-border-neutral bg-flag-soft px-3 py-1.5 text-[11px] text-flag">
                Le passage annoté a été supprimé du document — ce commentaire n&apos;est plus
                rattaché à un emplacement. Vous pouvez le supprimer ci-dessous.
              </p>
            ) : null}
            <div className="px-3">
              <CommentBubble
                comment={comment}
                currentUserName={currentUserName}
                onDelete={() => onDelete(comment.id, true)}
              />
              {comment.replies.map((reply) => (
                <div key={reply.id} className="border-t border-border-neutral">
                  <CommentBubble
                    comment={reply}
                    currentUserName={currentUserName}
                    onDelete={() => onDelete(reply.id, false)}
                  />
                </div>
              ))}
              <div className="pb-2">
                <ReplyComposer onSubmit={(content) => onReply(comment.id, content)} />
              </div>
            </div>
          </div>
          );
        })
      )}
    </div>
  );
}

function textReplyToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function AiChatBody({
  memoireId,
  editor,
  initialMessages,
  contextTruncated,
}: {
  memoireId: string;
  editor: Editor | null;
  initialMessages: ChatMessageView[];
  contextTruncated: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessageView[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  async function handleSend() {
    const content = input.trim();
    if (!content || isPending) return;
    setInput("");
    setIsPending(true);
    setError(null);

    // Bulle utilisateur optimiste — remplacée par l'entrée persistée (avec son vrai id) une
    // fois l'action revenue, pour ne pas dupliquer si l'étudiant relit vite l'historique.
    const optimisticId = `optimistic-${Date.now()}`;
    setMessages((current) => [
      ...current,
      { id: optimisticId, role: "USER", content, createdAt: new Date().toISOString() },
    ]);

    const result = await sendAiChatMessageAction(memoireId, content);
    setIsPending(false);

    setMessages((current) => {
      const withoutOptimistic = current.filter((message) => message.id !== optimisticId);
      const next = [...withoutOptimistic];
      if (result.userMessage) next.push(result.userMessage);
      if (result.assistantMessage) next.push(result.assistantMessage);
      return next;
    });

    if (result.error) setError(result.error);
  }

  // Insère la réponse entière, ou seulement la portion sélectionnée par l'étudiant dans la
  // bulle (sélection native du navigateur) s'il y en a une — jamais automatique, toujours
  // déclenché par ce bouton.
  function insertIntoDocument(message: ChatMessageView) {
    if (!editor) return;
    const selected = window.getSelection()?.toString().trim();
    const textToInsert = selected && selected.length > 0 ? selected : message.content;
    editor.chain().focus().insertContent(textReplyToHtml(textToInsert)).run();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {contextTruncated ? (
        <div className="flex shrink-0 items-start gap-2 border-b border-border-neutral bg-surface-neutral px-3 py-2.5 text-xs text-ink-muted">
          <CircleAlert size={14} className="mt-0.5 shrink-0" />
          <span>
            Votre document est long : l&apos;assistant travaille sur le début et la fin
            seulement, pas sur son intégralité. Ses réponses sur le milieu du texte peuvent
            être moins précises.
          </span>
        </div>
      ) : null}
      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="px-1 py-2 text-sm text-ink-muted">
            Posez une question à l&apos;assistant pour co-rédiger votre mémoire — conseils,
            reformulation, aide à structurer une idée.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                message.role === "USER"
                  ? "self-end bg-ink text-paper"
                  : "self-start border border-border-neutral bg-surface-neutral/60 text-ink"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.role === "ASSISTANT" ? (
                <button
                  type="button"
                  onClick={() => insertIntoDocument(message)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-dark underline decoration-dotted hover:text-accent"
                >
                  <ArrowDownToLine size={12} />
                  Insérer dans le document
                </button>
              ) : null}
            </div>
          ))
        )}
        {isPending ? (
          <p className="self-start rounded-2xl border border-border-neutral bg-surface-neutral/60 px-3.5 py-2.5 text-sm text-ink-muted">
            L&apos;assistant réfléchit…
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="shrink-0 px-3 pb-1">
          <p className="text-xs text-flag">{error}</p>
        </div>
      ) : null}

      <div className="flex shrink-0 items-end gap-2 border-t border-border-neutral p-3">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
          rows={2}
          placeholder="Posez votre question…"
          disabled={isPending}
          className="min-h-0 flex-1 resize-none rounded-lg border border-ink/15 bg-surface-light px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isPending || !input.trim()}
          aria-label="Envoyer"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

// Panneau latéral unique, réutilisant la structure visuelle (position fixe, largeur, tiroir
// mobile) déjà en place pour les commentaires — mais fonctionnellement distinct : deux
// contenus interchangeables via un sélecteur d'onglets quand le chat IA est disponible
// (mode "edit" uniquement), un seul panneau simple sinon (mode "annotate", jury).
function EditorSidePanel({
  editor,
  comments,
  unresolvedCommentIds,
  currentUserName,
  showChat,
  activeTab,
  onTabChange,
  mobileOpen,
  onMobileOpenChange,
  isCollapsed,
  onCollapsedChange,
  memoireId,
  initialChatMessages,
  documentContextTruncated,
  onNavigateToComment,
  onReply,
  onResolve,
  onDelete,
}: {
  editor: Editor | null;
  comments: DocumentCommentView[];
  unresolvedCommentIds: Set<string>;
  currentUserName: string;
  showChat: boolean;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  memoireId: string;
  initialChatMessages: ChatMessageView[];
  documentContextTruncated: boolean;
  onNavigateToComment: (comment: DocumentCommentView) => void;
  onReply: (parentId: string, content: string) => void;
  onResolve: (commentId: string) => void;
  onDelete: (commentId: string, isRoot: boolean) => void;
}) {
  const commentsLabel = `Commentaires${comments.length > 0 ? ` (${comments.length})` : ""}`;
  const resolvedTab: PanelTab = showChat ? activeTab : "comments";

  function closeMobile() {
    onMobileOpenChange(false);
  }

  function renderHeader(onClose?: () => void, onCollapse?: () => void) {
    const trailingButtons = (
      <div className="flex shrink-0 items-center">
        {onCollapse ? (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Réduire le panneau"
            title="Réduire le panneau"
            className="px-2 text-ink-muted transition hover:text-ink"
          >
            <ChevronRight size={16} />
          </button>
        ) : null}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le panneau"
            className="px-3 text-ink-muted transition hover:text-ink"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>
    );

    if (!showChat) {
      return (
        <div className="flex shrink-0 items-center justify-between border-b border-border-neutral px-4 py-3">
          <span className="text-sm font-medium text-ink">{commentsLabel}</span>
          {trailingButtons}
        </div>
      );
    }

    return (
      <div className="flex shrink-0 items-center border-b border-border-neutral">
        <button
          type="button"
          onClick={() => onTabChange("comments")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition ${
            resolvedTab === "comments"
              ? "border-b-2 border-ink text-ink"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          {commentsLabel}
        </button>
        <button
          type="button"
          onClick={() => onTabChange("chat")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition ${
            resolvedTab === "chat"
              ? "border-b-2 border-ink text-ink"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Assistant IA
        </button>
        {trailingButtons}
      </div>
    );
  }

  function navigateAndClose(comment: DocumentCommentView) {
    onNavigateToComment(comment);
    closeMobile();
  }

  const body =
    resolvedTab === "chat" ? (
      <AiChatBody
        memoireId={memoireId}
        editor={editor}
        initialMessages={initialChatMessages}
        contextTruncated={documentContextTruncated}
      />
    ) : (
      <CommentsList
        comments={comments}
        unresolvedCommentIds={unresolvedCommentIds}
        currentUserName={currentUserName}
        onNavigate={navigateAndClose}
        onReply={onReply}
        onResolve={onResolve}
        onDelete={onDelete}
      />
    );

  const floatingLabel = resolvedTab === "chat" ? "Assistant IA" : commentsLabel;
  const FloatingIcon = resolvedTab === "chat" ? Sparkles : MessageSquare;

  return (
    <>
      <button
        type="button"
        onClick={() => onMobileOpenChange(true)}
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full border border-border-neutral bg-surface-light px-4 py-2.5 text-sm font-medium text-ink shadow-lg lg:hidden"
      >
        <FloatingIcon size={16} />
        {floatingLabel}
      </button>

      {/* Position fixe (et non sticky) : indépendante du scroll de <main> et de la
          structure de layout parente, pour garantir un panneau qui reste à l'écran et
          scroll séparément du document, quoi qu'il arrive au-dessus dans l'arbre. */}
      {isCollapsed ? (
        <button
          type="button"
          onClick={() => onCollapsedChange(false)}
          aria-label={`Ouvrir le panneau ${floatingLabel}`}
          title={floatingLabel}
          className="hidden lg:fixed lg:top-24 lg:right-6 lg:z-30 lg:flex lg:h-12 lg:w-12 lg:items-center lg:justify-center lg:rounded-full lg:border lg:border-border-neutral lg:bg-surface-light lg:text-ink-muted lg:shadow-lg lg:transition lg:hover:text-ink"
        >
          <ChevronLeft size={18} />
        </button>
      ) : (
        <aside className="hidden lg:fixed lg:top-24 lg:right-6 lg:bottom-6 lg:z-30 lg:flex lg:w-80 lg:flex-col lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border-neutral lg:bg-surface-light lg:shadow-lg">
          {renderHeader(undefined, () => onCollapsedChange(true))}
          {body}
        </aside>
      )}

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 flex justify-end lg:hidden">
          <button
            type="button"
            aria-label="Fermer le panneau"
            onClick={closeMobile}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="relative flex h-full w-80 max-w-[85vw] flex-col bg-surface-light shadow-xl">
            {renderHeader(closeMobile)}
            {body}
          </div>
        </div>
      ) : null}
    </>
  );
}

function PresenceAvatars({ others }: { others: Map<number, { name: string }> }) {
  const otherUsers = Array.from(others.values());
  if (otherUsers.length === 0) return null;

  return (
    <div className="flex -space-x-2">
      {otherUsers.slice(0, 5).map((user, index) => (
        <div
          key={index}
          title={user.name || "Utilisateur"}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-light bg-accent/20 text-xs font-medium text-accent-dark"
        >
          {(user.name || "?").slice(0, 1).toUpperCase()}
        </div>
      ))}
    </div>
  );
}
