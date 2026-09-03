import { describe, it, expect } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { findTextRangeInDoc } from "./find-text-range";

// Schéma minimal (juste doc/paragraph/text) : findTextRangeInDoc ne dépend d'aucune extension
// Tiptap précise, seulement de l'API générique ProseMirror (descendants/isText/isBlock).
const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "text*", group: "block" },
    text: { group: "inline" },
  },
});

function buildDoc(paragraphs: string[]) {
  return schema.node(
    "doc",
    null,
    paragraphs.map((text) => schema.node("paragraph", null, text ? [schema.text(text)] : [])),
  );
}

describe("findTextRangeInDoc", () => {
  it("finds an exact match within a single paragraph", () => {
    const doc = buildDoc(["Ceci est un passage à retrouver dans le document."]);
    const range = findTextRangeInDoc(doc, "un passage à retrouver");
    expect(range).not.toBeNull();
    expect(doc.textBetween(range!.from, range!.to)).toBe("un passage à retrouver");
  });

  it("returns null when the excerpt is not present", () => {
    const doc = buildDoc(["Un texte qui ne contient pas la citation recherchée."]);
    expect(findTextRangeInDoc(doc, "texte totalement absent")).toBeNull();
  });

  it("tolerates whitespace differences between the needle and the document", () => {
    const doc = buildDoc(["Un texte avec des espaces multiples."]);
    const range = findTextRangeInDoc(doc, "texte   avec   des   espaces   multiples");
    expect(range).not.toBeNull();
  });

  it("matches text spanning two paragraphs via the synthetic separator", () => {
    const doc = buildDoc(["Fin de paragraphe", "Début du suivant"]);
    const range = findTextRangeInDoc(doc, "paragraphe Début");
    expect(range).not.toBeNull();
  });

  it("returns null for an empty or whitespace-only needle", () => {
    const doc = buildDoc(["Un texte quelconque."]);
    expect(findTextRangeInDoc(doc, "   ")).toBeNull();
    expect(findTextRangeInDoc(doc, "")).toBeNull();
  });

  it("returns null on an empty document", () => {
    const doc = buildDoc([""]);
    expect(findTextRangeInDoc(doc, "quoi que ce soit")).toBeNull();
  });
});
