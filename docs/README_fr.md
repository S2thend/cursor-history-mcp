# Cursor History MCP

<p align="center">
  <img src="cursor-history-mcp-logo.jpg" alt="cursor-history-mcp logo" width="200">
</p>

[![npm version](https://img.shields.io/npm/v/cursor-history-mcp.svg)](https://www.npmjs.com/package/cursor-history-mcp)
[![npm downloads](https://img.shields.io/npm/dm/cursor-history-mcp.svg)](https://www.npmjs.com/package/cursor-history-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=cursor-history&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImN1cnNvci1oaXN0b3J5LW1jcCJdfQ==)

**Serveur MCP pour parcourir, rechercher, exporter et sauvegarder votre historique de chat Cursor AI.**

Intégrez votre historique de chat Cursor AI directement dans Claude. Recherchez des conversations passées, exportez des sessions, créez des sauvegardes et générez des rapports de fin d'année — le tout en langage naturel. Construit sur le [Model Context Protocol](https://modelcontextprotocol.io/) pour une intégration transparente avec les assistants IA.

Gratuit, open-source et sous licence MIT. Créé par la communauté, pour la communauté.

## Pourquoi ce projet ?

Il existe d'autres outils pour l'historique Cursor (comme le [Cursor-history-MCP](https://github.com/Nossim/Cursor-history-MCP) basé sur Python). Voici ce qui rend celui-ci différent :

| Fonctionnalité | cursor-history-mcp (ce projet) | Autres solutions |
|----------------|--------------------------------|------------------|
| 📦 **Installation** | ✅ `npx cursor-history-mcp` - zéro installation | ❌ Docker, Python, dépendances |
| ⚡ **Vitesse** | ✅ Instantané - lectures SQLite directes | ❌ Lent - nécessite la vectorisation LLM |
| 🔍 **Recherche** | ✅ Correspondance textuelle de type Grep - précise et stable | ❌ Récupération vectorielle - résultats imprévisibles |
| 🤖 **LLM requis** | ✅ Non - fonctionne hors ligne | ❌ Oui - nécessite Ollama/embeddings |
| 🛠️ **Langage** | ✅ TypeScript (typage sûr) | ⚠️ Python |
| 💾 **Sauvegarde/Restauration** | ✅ Intégrée | ❌ Non disponible |
| 🚚 **Migration** | ✅ Déplacer des sessions entre espaces de travail | ❌ Non disponible |
| 📋 **Dépendances** | ✅ Minimales (juste Node.js) | ❌ Docker, LanceDB, Ollama, FastAPI |

### Avantages clés

- **Ultra rapide** : Pas d'étape d'embedding ou de vectorisation. Lit directement depuis la base de données SQLite native de Cursor, résultats instantanés.
- **Recherche de type Grep** : Utilise la correspondance textuelle directe au lieu de la récupération vectorielle. Plus léger, prévisible et stable — pas de résultats hallucinés, pas de dérive d'embedding, correspondances exactes à chaque fois.
- **Zéro configuration** : Exécutez avec `npx` - pas de conteneurs Docker, pas d'environnements Python, pas de clés API, pas de configuration LLM.
- **Fonctionne hors ligne** : Tout s'exécute localement sans services externes ni modèles IA.
- **Portabilité des données** : Capacités complètes de sauvegarde, restauration et migration inter-espaces de travail pour garder votre historique de chat en sécurité et portable.
- **Léger** : ~50 Ko de package vs images Docker de plusieurs Go avec bases de données vectorielles.

## Installation

Aucune installation requise ! Exécutez directement via npx :

```bash
npx cursor-history-mcp
```

## Configuration

### Cursor

![cursor-mcp-setup](cursor-mcp-setup.gif)

### Claude Code

Ajoutez à vos paramètres MCP de Claude Code :

```json
{
  "mcpServers": {
    "cursor-history": {
      "command": "npx",
      "args": ["-y", "cursor-history-mcp"]
    }
  }
}
```

### Claude Desktop

Ajoutez à votre configuration Claude Desktop (`~/.claude/claude_desktop_config.json`) :

```json
{
  "mcpServers": {
    "cursor-history": {
      "command": "npx",
      "args": ["-y", "cursor-history-mcp"]
    }
  }
}
```

## Outils disponibles

| Outil | Description |
|-------|-------------|
| `cursor_history_list` | Lister les sessions de chat avec métadonnées |
| `cursor_history_show` | Voir le contenu complet d'une conversation |
| `cursor_history_search` | Rechercher dans toutes les sessions |
| `cursor_history_export` | Exporter une session en Markdown ou JSON |
| `cursor_history_backup` | Créer une sauvegarde de tout l'historique |
| `cursor_history_restore` | Restaurer depuis une sauvegarde (destructif) |
| `cursor_history_migrate` | Déplacer/copier des sessions entre espaces de travail (destructif) |
| `cursor_history_year_pack` | Générer un package de données de fin d'année avec statistiques, sujets et modèle de prompt |

## 🎆 Rétrospective annuelle

Générez un rapport annuel personnalisé à partir de votre historique de chat Cursor AI — découvrez vos habitudes de code, vos sujets favoris et votre parcours de développement.

### Ce que vous obtenez

| | |
|---|---|
| 📊 **Statistiques** | Total de questions, mois actifs, activité mensuelle |
| 🏷️ **Découverte de sujets** | Sujets de code détectés automatiquement |
| 📈 **Suivi des tendances** | Comment votre focus a évolué au fil de l'année |
| 🔑 **Mots-clés** | Vos termes et expressions les plus utilisés |
| 🔒 **Vie privée** | Données sensibles masquées automatiquement |
| 📝 **Prompt LLM** | Prompt prêt à l'emploi pour un rapport soigné |

### Essayez

- « Générer mon bilan annuel Cursor 2025 »
- « Créer un year pack pour ~/myapp »
- « Générer mon bilan annuel 2025 en français »

## Exemples d'utilisation

Après la configuration, demandez à votre assistant IA :

- « Lister mes sessions de chat Cursor »
- « Montrer la session #1 »
- « Rechercher 'authentification' dans mon historique Cursor »
- « Exporter la session #1 en markdown »
- « Sauvegarder mon historique de chat Cursor »

## Prérequis

- Node.js 20+
- Cursor IDE installé avec un historique de chat existant

## Contribuer

Les contributions sont les bienvenues ! Que ce soit des rapports de bugs, des demandes de fonctionnalités, des améliorations de documentation ou des contributions de code — tous les PRs et issues sont appréciés.

- [Ouvrir un issue](https://github.com/S2thend/cursor-history-mcp/issues)
- [Soumettre un pull request](https://github.com/S2thend/cursor-history-mcp/pulls)

## Licence

MIT
