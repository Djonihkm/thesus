// src/lib/document-integrity.ts
//
// Filet DÉTECTIF (pas préventif) sur l'intégrité du texte du document collaboratif — voir le
// commentaire dans src/app/api/party-auth/route.ts : PartyKit n'a que lecture/écriture
// complète par room, donc le mode "annotation seule" du jury (surlignage/soulignage, jamais
// d'édition du texte) n'est appliqué que côté client (annotate-only-plugin.ts). Un jury
// techniquement outillé pourrait en théorie contourner cette barrière en parlant directement
// au WebSocket Yjs. Ce module ne l'EMPÊCHE pas il rend la dérive VISIBLE : on compare le
// texte réellement synchronisé dans le document Yjs live (lu via onRequest sur
// party/document.ts, protégé par PARTYKIT_INTERNAL_SECRET) au dernier checkpoint enregistré
// par l'étudiant (Memoire.editableContent, jamais modifiable que via mode="edit"). Un écart
// signale soit une triche technique, soit (cas bien plus probable) une édition étudiante en
// cours non encore enregistrée — ce n'est donc qu'un signal à investiguer manuellement dans
// les logs serveur, jamais une alerte fiable à 100%, et jamais bloquant pour l'affichage.
import * as Y from "yjs";
import { getPartyKitHost } from "@/lib/partykit";
import { logError } from "@/lib/log-error";

function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Parcourt récursivement le fragment XML Yjs et concatène le texte des noeuds YXmlText —
// YXmlText.toString() renvoie le contenu textuel brut (les marks de formatage n'apparaissent
// jamais dans cette chaîne), donc un ajout/retrait de surlignage n'affecte jamais ce résultat.
function extractPlainTextFromFragment(fragment: Y.XmlFragment): string {
  const parts: string[] = [];
  for (const node of fragment.toArray()) {
    if (node instanceof Y.XmlText) {
      parts.push(node.toString());
    } else if (node instanceof Y.XmlElement) {
      parts.push(extractPlainTextFromFragment(node));
    }
  }
  return parts.join(" ");
}

function normalizeForComparison(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// docId : voir documentRoomId (src/lib/partykit.ts). checkpointHtml : Memoire.editableContent
// au moment de l'appel. context : étiquette libre pour distinguer la source dans les logs
// (ex. "jury_page_load", "student_page_load").
export async function logDocumentIntegrityDrift(
  memoireId: string,
  docId: string,
  checkpointHtml: string | null,
  context: string,
): Promise<void> {
  try {
    if (!checkpointHtml) return;

    const secret = process.env.PARTYKIT_INTERNAL_SECRET;
    if (!secret) return;

    const protocol = getPartyKitHost().startsWith("127.0.0.1") ? "http" : "https";
    const response = await fetch(`${protocol}://${getPartyKitHost()}/parties/main/${docId}`, {
      headers: { "x-internal-secret": secret },
    });
    // Pas de distinction "room jamais ouverte" côté PartyKit : onRequest (party/document.ts)
    // renvoie toujours 200 avec un doc vide dans ce cas (unstable_getYDoc en crée un), donc
    // toute réponse non-ok ici signale une vraie erreur (mauvaise config d'hôte, secret
    // invalide, etc.), jamais un état attendu.
    if (!response.ok) throw new Error(`party onRequest a répondu ${response.status}`);

    const update = new Uint8Array(await response.arrayBuffer());
    const liveDoc = new Y.Doc();
    Y.applyUpdate(liveDoc, update);
    const liveText = normalizeForComparison(extractPlainTextFromFragment(liveDoc.getXmlFragment("default")));
    const checkpointText = normalizeForComparison(stripHtmlToPlainText(checkpointHtml));

    if (liveText !== checkpointText) {
      logError(
        `document-integrity:drift:${context}`,
        new Error("Dérive de texte détectée — peut être une édition étudiante en cours non enregistrée, à vérifier manuellement."),
        {
          memoireId,
          docId,
          checkpointLength: checkpointText.length,
          checkpointPreview: checkpointText.slice(0, 160),
          liveLength: liveText.length,
          livePreview: liveText.slice(0, 160),
        },
      );
    }
  } catch (error) {
    // Un filet détectif qui casse la page qu'il surveille serait pire que l'absence de filet.
    logError(`document-integrity:check-failed:${context}`, error, { memoireId });
  }
}
