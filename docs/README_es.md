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

**Servidor MCP para explorar, buscar, exportar y respaldar tu historial de chat de Cursor AI.**

Lleva tu historial de chat de Cursor AI directamente a Claude. Busca conversaciones pasadas, exporta sesiones, crea respaldos y genera informes de fin de año — todo mediante lenguaje natural. Construido sobre el [Model Context Protocol](https://modelcontextprotocol.io/) para una integración perfecta con asistentes de IA.

Gratuito, de código abierto y con licencia MIT. Creado por la comunidad, para la comunidad.

## ¿Por qué este proyecto?

Existen otras herramientas para el historial de Cursor (como [Cursor-history-MCP](https://github.com/Nossim/Cursor-history-MCP) basado en Python). Esto es lo que hace diferente a este proyecto:

| Característica | cursor-history-mcp (este proyecto) | Otras soluciones |
|----------------|-------------------------------------|------------------|
| 📦 **Instalación** | ✅ `npx cursor-history-mcp` - cero instalación | ❌ Docker, Python, dependencias |
| ⚡ **Velocidad** | ✅ Instantáneo - lecturas directas de SQLite | ❌ Lento - requiere vectorización LLM |
| 🔍 **Búsqueda** | ✅ Coincidencia de texto estilo Grep - precisa y estable | ❌ Recuperación vectorial - resultados impredecibles |
| 🤖 **LLM requerido** | ✅ No - funciona sin conexión | ❌ Sí - necesita Ollama/embeddings |
| 🛠️ **Lenguaje** | ✅ TypeScript (tipado seguro) | ⚠️ Python |
| 💾 **Respaldo/Restauración** | ✅ Integrado | ❌ No disponible |
| 🚚 **Migración** | ✅ Mover sesiones entre espacios de trabajo | ❌ No disponible |
| 📋 **Dependencias** | ✅ Mínimas (solo Node.js) | ❌ Docker, LanceDB, Ollama, FastAPI |

### Ventajas clave

- **Ultrarrápido**: Sin pasos de embedding o vectorización. Lee directamente de la base de datos SQLite nativa de Cursor, resultados instantáneos.
- **Búsqueda estilo Grep**: Usa coincidencia de texto directa en lugar de recuperación vectorial. Más ligero, predecible y estable — sin resultados alucinados, sin deriva de embeddings, coincidencias exactas cada vez.
- **Cero configuración**: Ejecuta con `npx` - sin contenedores Docker, sin entornos Python, sin claves API, sin configuración de LLM.
- **Funciona sin conexión**: Todo se ejecuta localmente sin servicios externos ni modelos de IA.
- **Portabilidad de datos**: Capacidades completas de respaldo, restauración y migración entre espacios de trabajo para mantener tu historial de chat seguro y portable.
- **Ligero**: Paquete de ~50KB vs imágenes Docker de varios GB con bases de datos vectoriales.

## Instalación

¡No se requiere instalación! Ejecuta directamente con npx:

```bash
npx cursor-history-mcp
```

## Configuración

### Cursor

![cursor-mcp-setup](cursor-mcp-setup.gif)

### Claude Code

Agrega a tu configuración MCP de Claude Code:

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

Agrega a tu configuración de Claude Desktop (`~/.claude/claude_desktop_config.json`):

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

## Herramientas disponibles

| Herramienta | Descripción |
|-------------|-------------|
| `cursor_history_list` | Listar sesiones de chat con metadatos |
| `cursor_history_show` | Ver el contenido completo de una conversación |
| `cursor_history_search` | Buscar en todas las sesiones |
| `cursor_history_export` | Exportar sesión a Markdown o JSON |
| `cursor_history_backup` | Crear respaldo de todo el historial |
| `cursor_history_restore` | Restaurar desde respaldo (destructivo) |
| `cursor_history_migrate` | Mover/copiar sesiones entre espacios de trabajo (destructivo) |
| `cursor_history_year_pack` | Generar paquete de datos de fin de año con estadísticas, temas y plantilla de prompt |

## 🎆 Resumen del año

Genera un informe anual personalizado de tu historial de chat de Cursor AI — descubre tus patrones de código, temas favoritos y tu trayectoria de desarrollo.

### Lo que obtienes

| | |
|---|---|
| 📊 **Estadísticas** | Total de preguntas, meses activos, actividad mensual |
| 🏷️ **Descubrimiento de temas** | Temas de código detectados automáticamente |
| 📈 **Seguimiento de tendencias** | Cómo cambió tu enfoque a lo largo del año |
| 🔑 **Palabras clave** | Tus términos y frases más usados |
| 🔒 **Privacidad segura** | Datos sensibles enmascarados automáticamente |
| 📝 **Prompt LLM** | Prompt listo para generar un informe pulido |

### Pruébalo

- "Genera mi resumen anual de Cursor 2025"
- "Crea un year pack para ~/myapp"
- "Genera mi resumen del año 2025 en español"

## Ejemplos de uso

Después de configurar, pregunta a tu asistente de IA:

- "Lista mis sesiones de chat de Cursor"
- "Muestra la sesión #1"
- "Busca 'autenticación' en mi historial de Cursor"
- "Exporta la sesión #1 como markdown"
- "Respalda mi historial de chat de Cursor"

## Requisitos

- Node.js 20+
- Cursor IDE instalado con historial de chat existente

## Contribuir

¡Las contribuciones son bienvenidas! Ya sean reportes de errores, solicitudes de funciones, mejoras de documentación o contribuciones de código — todos los PRs e issues son apreciados.

- [Abrir un issue](https://github.com/S2thend/cursor-history-mcp/issues)
- [Enviar un pull request](https://github.com/S2thend/cursor-history-mcp/pulls)

## Licencia

MIT
