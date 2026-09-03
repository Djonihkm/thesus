import { describe, it, expect } from "vitest";
import { suggestJurorsForCategory } from "./jury-assignment";

describe("suggestJurorsForCategory", () => {
  it("ranks an exact specialty match first", () => {
    const jurors = [
      { id: "a", name: "A", specialty: "Marketing digital" },
      { id: "b", name: "B", specialty: "Sécurité informatique" },
    ];
    const [first] = suggestJurorsForCategory("Sécurité informatique", jurors);
    expect(first.id).toBe("b");
    expect(first.score).toBeGreaterThan(0);
  });

  it("includes jurors without a specialty at the end, with score 0", () => {
    const jurors = [{ id: "a", name: "A", specialty: null }];
    const [first] = suggestJurorsForCategory("Comptabilité", jurors);
    expect(first.score).toBe(0);
  });

  it("never excludes a juror outright, regardless of relevance", () => {
    const jurors = [
      { id: "a", name: "A", specialty: "Astrophysique" },
      { id: "b", name: "B", specialty: null },
    ];
    const suggestions = suggestJurorsForCategory("Droit des affaires", jurors);
    expect(suggestions).toHaveLength(2);
  });

  // Voir AUDIT.md : "la suggestion de jury ignore la charge de travail" — corrigé en
  // pénalisant le score de spécialité proportionnellement au nombre de mémoires déjà
  // assignés, sans jamais laisser la charge l'emporter sur un écart de spécialité important.
  describe("workload penalty", () => {
    it("prefers a less loaded juror over a more loaded one with the same specialty", () => {
      const jurors = [
        { id: "loaded", name: "Loaded", specialty: "Finance" },
        { id: "free", name: "Free", specialty: "Finance" },
      ];
      const workload = new Map([["loaded", [1, 2, 3]]]);
      const suggestions = suggestJurorsForCategory("Finance", jurors, workload);
      expect(suggestions[0].id).toBe("free");
    });

    it("still ranks a much better specialty match above a lightly loaded worse match", () => {
      const jurors = [
        { id: "exact", name: "Exact", specialty: "Cybersécurité" },
        { id: "unrelated", name: "Unrelated", specialty: "Ressources humaines" },
      ];
      // Une seule charge sur le meilleur candidat ne doit pas le faire chuter derrière un
      // candidat sans rapport avec le sujet.
      const workload = new Map([["exact", [1]]]);
      const suggestions = suggestJurorsForCategory("Cybersécurité", jurors, workload);
      expect(suggestions[0].id).toBe("exact");
    });

    it("never produces a negative score", () => {
      const jurors = [{ id: "a", name: "A", specialty: "Finance" }];
      const workload = new Map([["a", Array.from({ length: 50 })]]);
      const [first] = suggestJurorsForCategory("Finance", jurors, workload);
      expect(first.score).toBeGreaterThanOrEqual(0);
    });
  });
});
