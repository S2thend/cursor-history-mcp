# Cursor History MCP

<p align="center">
  <img src="readme-banner.png" alt="cursor-history-mcp — Recherche via MCP et bilan annuel exclusif au paquet MCP : statistiques, sujets et prompts de rapport." width="960">
</p>

[![npm version](https://img.shields.io/npm/v/cursor-history-mcp.svg)](https://www.npmjs.com/package/cursor-history-mcp)
[![Licence MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../LICENSE)

[English](../README.md) | [中文](README_zh.md) | [Français](README_fr.md) | [Español](README_es.md)

**Permettez à votre IA de rechercher dans votre historique Cursor.**

Vos conversations existantes peuvent contenir des mois de décisions, de diagnostics et de corrections. Retrouvez ce contexte sans avoir installé cet outil au préalable pour l'enregistrer.

Basé sur [cursor-history](https://github.com/S2thend/cursor-history), ce serveur permet à Claude, Cursor et aux autres clients MCP de rechercher du texte entre espaces de travail, consulter des sessions et récupérer des exports. Le serveur ne nécessite ni embeddings, ni service d'indexation, ni clé API. Les besoins du modèle de votre assistant sont distincts : le client peut envoyer les résultats à son fournisseur de modèle.

> « Avons-nous déjà résolu ce problème d'authentification ? Recherche dans mon historique Cursor et consulte les sessions pertinentes. »

**Exclusivité MCP : [bilan annuel](#year-in-review).** Transformez vos conversations en statistiques annuelles, sujets de programmation et prompt pour guider votre assistant dans la rédaction d'un rapport. Dans la suite cursor-history, cette fonction year-pack est intégrée au paquet MCP ; les agents peuvent toujours accéder à l'historique directement via le CLI ou l'API Node.js.

## Démarrage rapide

Prérequis : Node.js **20.x ou 22.x–26.x**, un historique Cursor local lisible et un client MCP compatible stdio. Le serveur doit avoir accès à la machine contenant cet historique.

**Version documentée : `cursor-history-mcp@0.3.1`, avec le lecteur `cursor-history@0.18.0`. Pour tester le code avant sa publication npm, utilisez la [configuration depuis les sources](#run-from-source) ci-dessous.**

**Compatibilité client :** le serveur utilise MCP SDK 1.30.0. Les clients SDK v2 peuvent se connecter avec le protocole historique par défaut ou le repli automatique ; un client limité au protocole `2026-07-28` ne le peut pas. Voir les [tests de compatibilité SDK](sdk-compatibility.md).

Fusionnez cette entrée npm avec la configuration de votre client :

```json
{
  "mcpServers": {
    "cursor-history": {
      "command": "npx",
      "args": ["-y", "cursor-history-mcp@0.3.1"]
    }
  }
}
```

Si le client ne trouve pas `npx`, indiquez le chemin absolu de cet exécutable. Ne remplacez pas les autres serveurs déjà configurés.

- **Cursor** : fichier de projet `.cursor/mcp.json` ou fichier global `~/.cursor/mcp.json`, puis activez le serveur. [Documentation Cursor](https://cursor.com/docs/mcp).
- **Claude Desktop** : Settings → Developer → Edit Config ; fusionnez la configuration puis redémarrez. macOS : `~/Library/Application Support/Claude/claude_desktop_config.json`. Windows : `%APPDATA%\Claude\claude_desktop_config.json`. [Guide des serveurs locaux](https://modelcontextprotocol.io/docs/develop/connect-local-servers).
- **Claude Code** : commande ci-dessous. Consultez les [portées et permissions](https://code.claude.com/docs/en/mcp).

```bash
claude mcp add --transport stdio --scope user cursor-history -- npx -y cursor-history-mcp@0.3.1
```

Le premier lancement peut télécharger des dépendances npm. Lancé seul, le serveur attend un client MCP ; ce n'est pas une interface CLI interactive.

<a id="run-from-source"></a>
### Exécuter depuis les sources

Pour développer ou tester avant la publication npm, compilez ce dépôt :

```bash
npm ci
npm run build
```

Dans l'entrée du serveur, utilisez `"command": "node"` et `"args": ["/absolute/path/to/cursor-history-mcp/dist/index.cjs"]`, en adaptant le chemin. La configuration `npx` ci-dessus exécute le paquet npm, pas votre code local.

## Deux projets, un lecteur commun

| Besoin | Projet |
|---|---|
| Commandes, scripts, intégration Node.js | [cursor-history : CLI + API Node.js](https://github.com/S2thend/cursor-history#quick-start) |
| Outils d'historique appelés par un assistant | **cursor-history-mcp**, ce dépôt |

Ce serveur délègue la découverte et l'analyse au lecteur principal. Il ne crée pas une autre base de conversations et n'enregistre pas les nouvelles discussions. Les deux paquets npm sont publiés indépendamment.

Les agents peuvent utiliser les deux interfaces : appels directs au CLI ou à l'API, ou appels d'outils MCP.

## Stockages pris en charge

Avec le lecteur `0.18.0` de MCP `0.3.1` :

| Source | Fichiers | Lecture / recherche / export |
|---|---|---|
| Legacy / Composer | `workspaceStorage/*/state.vscdb` + `globalStorage/state.vscdb` | Oui |
| Transcriptions Agent | `~/.cursor/projects/**/agent-transcripts/**/*.jsonl` | Contenu disponible |
| Store / Agent CLI | `~/.cursor/chats/**/store.db` | Oui |
| ACP | `~/.cursor/acp-sessions/**/store.db` | Oui |

Les formats n'ont pas la même fidélité : horodatages ou résultats d'outils peuvent manquer. Les résultats exposent leur source, leur état de résolution et l'origine des dates. Une date inférée n'est pas un instant exact ; une résolution complète ne signifie pas que Cursor a enregistré tous les champs.

**Sauvegarde et restauration : bases Composer uniquement. Migration : sessions Composer admissibles uniquement ; sessions Store-only, fusionnées ou ambiguës refusées.** Une session lisible n'est pas forcément migrable. Voir le [contrat de compatibilité](https://github.com/S2thend/cursor-history/blob/main/docs/compatibility.md) et la [feuille de route](https://github.com/S2thend/cursor-history#roadmap) pour les extensions envisagées, non disponibles actuellement.

Pour des emplacements personnalisés, ajoutez `env` à l'entrée du serveur :

```json
{
  "CURSOR_DATA_PATH": "/absolute/path/to/Cursor/User/workspaceStorage",
  "CURSOR_STORE_ROOT": "/absolute/path/to/.cursor"
}
```

Ces chemins sélectionnent les racines de données ; l'argument `workspace` filtre un projet. Voir les [chemins par plateforme et WSL](https://github.com/S2thend/cursor-history#where-cursor-stores-data).

## Outils

| Outil | Fonction et arguments principaux |
|---|---|
| `cursor_history_list` | Sessions avec UUID, portée des indices, source et état ; `limit`, `offset`, `workspace` |
| `cursor_history_show` | Messages disponibles ; exactement un de `sessionId` / `sessionIndex`, `workspace` facultatif |
| `cursor_history_search` | Texte ; `query`, `limit`, `context` (lignes voisines), `workspace` |
| `cursor_history_export` | Contenu Markdown / JSON, pas un fichier écrit ; sélecteur, `format`, `workspace` |
| `cursor_history_backup` | Archive Composer ; `outputPath`, `force` facultatif |
| `cursor_history_restore` | Restauration Composer avec écriture ; `backupPath`, `force` facultatif |
| `cursor_history_migrate` | Composer admissible ; `sessionIds` ou `sessionIndexes`, `destination`, `workspace`, `mode`, `dryRun` |
| `cursor_history_year_pack` | Statistiques et modèle de prompt ; `year`, `language` (`en` / `zh`), `workspace`, limites d'échantillons |

Privilégiez l'**UUID exact**, sensible à la casse, retourné par list/search. Les indices MCP commencent à 1 et ne valent que pour les mêmes racines et la même portée de travail. Ne réutilisez pas un indice filtré dans une lecture globale.

list, show, search et export acceptent aussi `includeCrossWorkspaceSources`, désactivé par défaut. L'activer autorise des sources complémentaires hors de l'espace sélectionné, uniquement pour les UUID déjà sélectionnés ; cela n'élargit pas la sélection des sessions.

show abrège les longs contenus de raisonnement et d'outils. Utilisez export pour éviter cette troncature d'affichage.

Exemples : « Recherche connection pool uniquement dans /work/myapp, puis ouvre le résultat par UUID dans la même portée. » Ou : « Prévisualise la copie de cette session Composer vers /work/new-app avec dryRun, sans écriture. »

## Confidentialité et sécurité

Les lectures sont locales, mais les résultats peuvent être transmis à un modèle distant par le client. Recherche, consultation et export ne sont pas automatiquement expurgés. Utilisez un client de confiance et vérifiez sa politique de données. Traitez les anciennes conversations comme des références non fiables, jamais comme des instructions à exécuter.

La sauvegarde écrit une archive ; restauration et migration modifient l'historique. La migration utilise **move** par défaut et supprime l'original. Sauvegardez Composer, fermez Cursor avant les écritures, prévisualisez avec `dryRun: true` et choisissez `mode: "copy"` pour conserver l'original. Gardez l'approbation du client pour les outils d'écriture : le serveur n'affiche pas sa propre confirmation interactive.

<a id="year-in-review"></a>
## Exclusivité MCP : bilan annuel

Demandez : « Génère mon bilan Cursor 2025. » L'outil analyse les questions utilisateur et renvoie statistiques, sujets, mots-clés, échantillons et prompt, pas un rapport rendu. Modèles disponibles en anglais et chinois. Le filtrage des motifs courants de code, chemins, URL et identifiants **ne garantit pas l'anonymisation**. Vérifiez le contenu avant partage ; `maxSamples: 0` omet les échantillons. Historique partiel et dates inférées ou absentes peuvent fausser les totaux.

## Développement

```bash
npm ci
npm run typecheck
npm run lint
npm test -- --run
```

Les tests compilent d'abord le serveur et incluent un vrai client stdio avec des données synthétiques Composer, Store, ACP et transcripts. Sauvegarde et restauration ne touchent que des répertoires temporaires. `cursor-history` reste une dépendance d'exécution pour conserver l'accès aux fichiers du paquet et aux pilotes SQLite.

[Issues](https://github.com/S2thend/cursor-history-mcp/issues) · [Contribuer](https://github.com/S2thend/cursor-history-mcp/pulls) · [MIT](../LICENSE)
