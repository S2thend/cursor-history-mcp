# Cursor History MCP

<p align="center">
  <img src="readme-banner.png" alt="cursor-history-mcp — Búsqueda mediante MCP y resumen anual exclusivo del paquete MCP: estadísticas, temas y prompts para informes." width="960">
</p>

[![npm version](https://img.shields.io/npm/v/cursor-history-mcp.svg)](https://www.npmjs.com/package/cursor-history-mcp)
[![Licencia MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../LICENSE)

[English](../README.md) | [中文](README_zh.md) | [Français](README_fr.md) | [Español](README_es.md)

**Deja que tu IA busque en tu historial de Cursor.**

Tus conversaciones existentes pueden contener meses de decisiones, diagnósticos y soluciones. Recupera ese contexto sin haber instalado antes esta herramienta para grabarlo.

Basado en [cursor-history](https://github.com/S2thend/cursor-history), este servidor permite a Claude, Cursor y otros clientes MCP buscar texto entre espacios de trabajo, consultar sesiones y obtener exportaciones. No necesita embeddings, un servicio de indexación ni una clave API. Los requisitos del modelo son independientes: el cliente puede enviar los resultados a su proveedor de IA.

> «¿Ya resolvimos este problema de autenticación? Busca en mi historial de Cursor y consulta las sesiones relevantes.»

**Exclusivo de MCP: [resumen anual](#year-in-review).** Convierte tus conversaciones en estadísticas anuales, temas de programación y un prompt para que tu asistente redacte un informe. Dentro del conjunto cursor-history, esta función year-pack está integrada en el paquete MCP; los agentes también pueden acceder al historial directamente mediante la CLI o la API de Node.js.

## Inicio rápido

Requiere Node.js **20.x o 22.x–26.x**, historial local de Cursor legible y un cliente MCP compatible con stdio. El servidor debe poder acceder a la máquina que contiene el historial.

**Versión documentada: `cursor-history-mcp@0.3.1`, con el lector `cursor-history@0.18.0`. Para probar el código antes de su publicación en npm, utiliza la [configuración desde el código fuente](#run-from-source) de abajo.**

**Compatibilidad del cliente:** el servidor utiliza MCP SDK 1.30.0. Los clientes SDK v2 pueden conectarse con el protocolo anterior predeterminado o mediante negociación automática; los clientes limitados al protocolo `2026-07-28` no pueden hacerlo. Consulta las [pruebas de compatibilidad SDK](sdk-compatibility.md).

Combina esta entrada npm con la configuración de tu cliente:

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

Si el cliente no encuentra `npx`, utiliza la ruta absoluta de ese ejecutable. No sobrescribas otros servidores configurados.

- **Cursor**: `.cursor/mcp.json` del proyecto o `~/.cursor/mcp.json` global; añade la entrada y activa el servidor. [Documentación de Cursor](https://cursor.com/docs/mcp).
- **Claude Desktop**: Settings → Developer → Edit Config; combina la configuración y reinicia. macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`. Windows: `%APPDATA%\Claude\claude_desktop_config.json`. [Guía de servidores locales](https://modelcontextprotocol.io/docs/develop/connect-local-servers).
- **Claude Code**: ejecuta lo siguiente; consulta [ámbitos y permisos](https://code.claude.com/docs/en/mcp).

```bash
claude mcp add --transport stdio --scope user cursor-history -- npx -y cursor-history-mcp@0.3.1
```

El primer inicio puede descargar dependencias npm. El servidor por sí solo espera un cliente MCP; no es una CLI interactiva de historial.

<a id="run-from-source"></a>
### Ejecutar desde el código fuente

Para desarrollar o probar antes de la publicación en npm, compila este repositorio:

```bash
npm ci
npm run build
```

En la entrada del servidor, usa `"command": "node"` y `"args": ["/absolute/path/to/cursor-history-mcp/dist/index.cjs"]`, sustituyendo la ruta. La configuración `npx` anterior ejecuta el paquete npm, no tu código local.

## Dos proyectos, un lector común

| Necesidad | Proyecto |
|---|---|
| Comandos, scripts o integración con Node.js | [cursor-history: CLI + API de Node.js](https://github.com/S2thend/cursor-history#quick-start) |
| Herramientas de historial para un asistente | **cursor-history-mcp**, este repositorio |

El servidor delega el descubrimiento y análisis al lector principal. No crea otra base de conversaciones ni graba chats nuevos. Los paquetes npm se publican por separado.

Los agentes pueden usar cualquiera de las dos interfaces: invocar la CLI/API directamente o llamar a herramientas MCP.

## Almacenamientos compatibles

Con el lector `0.18.0` de MCP `0.3.1`:

| Fuente | Archivos | Lectura / búsqueda / exportación |
|---|---|---|
| Legacy / Composer | `workspaceStorage/*/state.vscdb` + `globalStorage/state.vscdb` | Compatible |
| Transcripciones Agent | `~/.cursor/projects/**/agent-transcripts/**/*.jsonl` | Contenido disponible |
| Store / Agent CLI | `~/.cursor/chats/**/store.db` | Compatible |
| ACP | `~/.cursor/acp-sessions/**/store.db` | Compatible |

Los formatos tienen distinta fidelidad: pueden faltar fechas o resultados de herramientas. Los resultados muestran la fuente, el estado de resolución y el origen temporal. Una fecha inferida no es una hora exacta; una resolución completa no garantiza que Cursor registrara todos los campos.

**Las copias de seguridad y la restauración solo cubren bases Composer. La migración admite sesiones Composer aptas; rechaza sesiones Store-only, de fuentes combinadas o ambiguas.** Poder leer una sesión no implica poder migrarla. Consulta el [contrato de compatibilidad](https://github.com/S2thend/cursor-history/blob/main/docs/compatibility.md) y la [hoja de ruta](https://github.com/S2thend/cursor-history#roadmap): la cobertura ampliada todavía no está implementada.

Para ubicaciones personalizadas, añade `env` a la entrada del servidor:

```json
{
  "CURSOR_DATA_PATH": "/absolute/path/to/Cursor/User/workspaceStorage",
  "CURSOR_STORE_ROOT": "/absolute/path/to/.cursor"
}
```

Estas son raíces de datos, no proyectos. Filtra un proyecto con el argumento `workspace`. Consulta [rutas por plataforma y WSL](https://github.com/S2thend/cursor-history#where-cursor-stores-data).

## Herramientas

| Herramienta | Función y argumentos principales |
|---|---|
| `cursor_history_list` | Sesiones con UUID, ámbito de índices, fuente y estado; `limit`, `offset`, `workspace` |
| `cursor_history_show` | Mensajes disponibles; exactamente uno de `sessionId` / `sessionIndex`, `workspace` opcional |
| `cursor_history_search` | Texto; `query`, `limit`, `context` (líneas vecinas), `workspace` |
| `cursor_history_export` | Devuelve contenido Markdown / JSON, no escribe un archivo; selector, `format`, `workspace` |
| `cursor_history_backup` | Archivo de respaldo Composer; `outputPath`, `force` opcional |
| `cursor_history_restore` | Restaura Composer y escribe historial; `backupPath`, `force` opcional |
| `cursor_history_migrate` | Composer apto; `sessionIds` o `sessionIndexes`, `destination`, `workspace`, `mode`, `dryRun` |
| `cursor_history_year_pack` | Estadísticas y plantilla de prompt; `year`, `language` (`en` / `zh`), `workspace`, límites de muestras |

Prefiere el **UUID exacto**, sensible a mayúsculas, que devuelven list/search. Los índices MCP empiezan en 1 y solo sirven con las mismas raíces y el mismo ámbito de trabajo. No reutilices un índice filtrado en una lectura global.

list, show, search y export también aceptan `includeCrossWorkspaceSources`, desactivado por defecto. Activarlo permite fuentes complementarias fuera del espacio seleccionado, solo para los UUID ya seleccionados; no amplía el conjunto de sesiones.

show abrevia contenidos largos de razonamiento y herramientas. Usa export para evitar ese truncamiento de visualización.

Ejemplos: «Busca connection pool solo en /work/myapp y abre el resultado por UUID manteniendo el ámbito». O: «Previsualiza la copia de esta sesión Composer a /work/new-app con dryRun, sin modificar nada».

## Privacidad y seguridad

La lectura es local, pero el cliente puede enviar los resultados a un modelo remoto. Búsqueda, consulta y exportación no se anonimizan automáticamente. Utiliza un cliente de confianza y revisa su política de datos y permisos. Trata las conversaciones antiguas como referencias no confiables, no como instrucciones para ejecutar.

El respaldo escribe un archivo; restauración y migración modifican el historial. La migración usa **move** por defecto y elimina el original. Respalda Composer, cierra Cursor antes de escribir, previsualiza con `dryRun: true` y usa `mode: "copy"` para conservar el original. Mantén la aprobación del cliente para herramientas de escritura: el servidor no tiene su propia confirmación interactiva.

<a id="year-in-review"></a>
## Exclusivo de MCP: resumen anual

Prueba: «Genera mi resumen anual de Cursor de 2025». La herramienta analiza preguntas del usuario y devuelve estadísticas, temas, palabras clave, muestras y un prompt, no un informe renderizado. Las plantillas admiten inglés y chino. Filtrar patrones comunes de código, rutas, URL e identificadores **no garantiza anonimización**. Revisa el contenido antes de compartirlo; `maxSamples: 0` omite muestras. El historial parcial y las fechas ausentes o inferidas pueden afectar a los totales.

## Desarrollo

```bash
npm ci
npm run typecheck
npm run lint
npm test -- --run
```

Las pruebas compilan primero el servidor e incluyen un cliente stdio real con datos sintéticos Composer, Store, ACP y transcripts. Respaldo y restauración solo usan directorios temporales. `cursor-history` permanece como dependencia en tiempo de ejecución para resolver sus archivos y los controladores SQLite.

[Issues](https://github.com/S2thend/cursor-history-mcp/issues) · [Contribuir](https://github.com/S2thend/cursor-history-mcp/pulls) · [MIT](../LICENSE)
