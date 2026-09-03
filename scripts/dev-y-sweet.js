#!/usr/bin/env node
// Lance le serveur Y-Sweet local pour `npm run dev` (voir package.json) — jamais utilisé
// en prod (Vercel ne lance que "next build", jamais "dev") : le paquet y-sweet est une
// devDependency, dont le postinstall a délibérément été laissé désapprouvé (pas d'entrée
// "y-sweet" dans "allowScripts" du package.json racine — voir npm approve-scripts) pour
// qu'il ne télécharge PAS son binaire serveur (~17 Mo, réseau vers GitHub) à chaque
// `npm install` sur Vercel — un paquet dont on n'a besoin qu'en local n'a aucune raison
// de faire échouer un build prod si ce téléchargement a un pépin. On appelle donc nous-
// mêmes sa fonction getBinary() ci-dessous, en local uniquement, pour déclencher ce
// téléchargement à la première utilisation réelle plutôt qu'à l'installation.
//
// Sur Windows, le binaire téléchargé n'a PAS d'extension .exe — spawnSync sans shell
// (utilisé aussi bien par le CLI y-sweet lui-même que par concurrently/cmd.exe) refuse
// d'exécuter un fichier sans extension reconnue sur Windows, et échoue silencieusement
// (ENOENT avalé par le wrapper du paquet : code de sortie 0, aucune sortie). Exécuter ce
// même binaire directement depuis Git Bash fonctionne, mais uniquement parce que bash
// contourne entièrement la résolution de spawn de Node — pas une solution utilisable
// depuis un script géré par Node (comme ce fichier, ou concurrently). Copier le binaire
// une fois vers un nom en .exe contourne le problème. macOS/Linux n'ont pas cette
// restriction et peuvent l'exécuter tel quel.
const { spawnSync } = require("node:child_process");
const { existsSync, copyFileSync } = require("node:fs");
const path = require("node:path");
const { getBinary } = require("y-sweet/src/get-binary");

const STORE = "./.y-sweet-data";

async function main() {
  const binaryPath = await getBinary();

  let result;
  if (process.platform === "win32") {
    const exePath = binaryPath + ".exe";
    if (!existsSync(exePath)) copyFileSync(binaryPath, exePath);
    result = spawnSync(exePath, ["serve", STORE], { stdio: "inherit" });
  } else {
    result = spawnSync(binaryPath, ["serve", STORE], { stdio: "inherit" });
  }

  process.exit(result.status ?? 1);
}

main();
