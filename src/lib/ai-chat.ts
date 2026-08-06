// src/lib/ai-chat.ts
import { getAiClient, getAiModel } from "@/lib/ai-client";

const MAX_DOCUMENT_CONTEXT_CHARACTERS = 12_000;
const DOCUMENT_HEAD_CHARACTERS = 4_000;

function stripHtml(html: string): string {
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

// Le document peut largement dépasser ce qui est utile à envoyer pour une simple question de
// chat (mémoire de 50+ pages) — on privilégie le début (cadrage du sujet) et la fin (contenu
// le plus récemment rédigé, le plus pertinent pour une aide "à partir d'ici") plutôt qu'une
// troncature naïve ou un résumé recalculé par le modèle à chaque message (latence/coût
// supplémentaires pour un gain marginal sur ce cas d'usage).
function buildDocumentContext(editableContent: string | null): string {
  const text = stripHtml(editableContent ?? "");
  if (!text) return "(Le document est vide pour l'instant.)";
  if (text.length <= MAX_DOCUMENT_CONTEXT_CHARACTERS) return text;

  const head = text.slice(0, DOCUMENT_HEAD_CHARACTERS);
  const tail = text.slice(-(MAX_DOCUMENT_CONTEXT_CHARACTERS - DOCUMENT_HEAD_CHARACTERS));
  return `${head}\n\n[...contenu intermédiaire omis pour rester dans la limite de contexte...]\n\n${tail}`;
}

export interface ChatTurn {
  role: "USER" | "ASSISTANT";
  content: string;
}

export async function generateChatReply(input: {
  themeTitle: string | null;
  editableContent: string | null;
  // Historique déjà borné par l'appelant (voir sendAiChatMessageAction) — dernier tour
  // inclus = le message que l'étudiant vient d'envoyer.
  history: ChatTurn[];
}): Promise<string> {
  const client = getAiClient();
  const documentContext = buildDocumentContext(input.editableContent);

  const systemInstruction =
    "Tu es un assistant d'écriture académique intégré à l'éditeur de mémoire d'un étudiant. " +
    (input.themeTitle ? `Le thème du mémoire est : « ${input.themeTitle} ». ` : "") +
    "Aide à structurer les idées, reformuler des passages, clarifier des raisonnements et " +
    "répondre aux questions de méthodologie — en français, de façon concise et actionnable. " +
    "Tu ne rédiges jamais le mémoire à la place de l'étudiant de ta propre initiative ; " +
    "propose des suggestions qu'il pourra insérer lui-même dans le document s'il le souhaite. " +
    "Voici le contenu déjà rédigé dans le document, pour rester cohérent avec l'existant " +
    `(un extrait si le document est long) :\n\n${documentContext}`;

  const contents = input.history.map((turn) => ({
    role: turn.role === "USER" ? ("user" as const) : ("model" as const),
    parts: [{ text: turn.content }],
  }));

  const response = await client.models.generateContent({
    model: getAiModel(),
    contents,
    config: { systemInstruction },
  });

  const replyText = response.text;
  if (!replyText) {
    throw new Error("Le modèle n'a pas retourné de réponse.");
  }
  return replyText;
}
