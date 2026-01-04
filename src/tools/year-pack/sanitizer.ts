/**
 * Text sanitization utilities for year-pack
 * Security-critical: removes/masks sensitive content from user messages
 */

import { DEFAULT_CONFIG } from "./types.js";

// ============================================================================
// Regex Patterns for Sensitive Content Detection
// ============================================================================

/**
 * Matches markdown code blocks (``` or ~~~)
 */
const CODE_BLOCK_PATTERN = /```[\s\S]*?```|~~~[\s\S]*?~~~/g;

/**
 * Matches inline code (`code`)
 */
const INLINE_CODE_PATTERN = /`[^`]+`/g;

/**
 * Matches shell command lines (starting with $, >, #, or common command prefixes)
 */
const COMMAND_LINE_PATTERN =
  /^[\s]*[$>#]\s*.+$|^[\s]*(npm|yarn|pnpm|git|python|pip|node|deno|bun|cargo|go|make|docker|kubectl|helm|terraform|aws|gcloud|az)\s+.+$/gim;

/**
 * Matches file paths (Unix and Windows style)
 * Examples: /path/to/file, ./relative, ../parent, C:\Windows\path, ~/home
 */
const FILE_PATH_PATTERN =
  /(?:~\/|\.\.?\/|\/(?!\/)|[A-Za-z]:\\)[^\s\n\r<>"|?*]+/g;

/**
 * Matches URLs (http, https, ftp, file protocols)
 */
const URL_PATTERN =
  /(?:https?|ftp|file):\/\/[^\s<>"\])}]+|www\.[^\s<>"\])}]+/gi;

/**
 * Matches email addresses
 */
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Matches IPv4 addresses
 */
const IPV4_PATTERN = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

/**
 * Matches IPv6 addresses (simplified pattern)
 */
const IPV6_PATTERN =
  /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b|\b(?:[0-9a-fA-F]{1,4}:){1,7}:|::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}\b/g;

/**
 * Matches potential secrets/tokens/API keys
 * - Long alphanumeric strings (32+ chars)
 * - Common secret patterns (sk_, pk_, api_, token_, etc.)
 * - Base64-like strings with mixed case
 */
const SECRET_PATTERNS = [
  // API keys with common prefixes (sk_live_, pk_test_, etc.)
  /\b(?:sk|pk|api|token|key|secret|password|auth|bearer|access)[-_][a-zA-Z0-9_-]{16,}\b/gi,
  // Long hex strings (likely hashes or tokens)
  /\b[0-9a-fA-F]{32,}\b/g,
  // Long alphanumeric strings that look like tokens
  /\b[A-Za-z0-9+/=]{40,}\b/g,
  // AWS-style keys
  /\bAKIA[0-9A-Z]{16}\b/g,
  // GitHub tokens
  /\bghp_[a-zA-Z0-9]{36}\b/g,
  /\bgho_[a-zA-Z0-9]{36}\b/g,
  /\bghu_[a-zA-Z0-9]{36}\b/g,
  /\bghs_[a-zA-Z0-9]{36}\b/g,
  /\bghr_[a-zA-Z0-9]{36}\b/g,
  // npm tokens
  /\bnpm_[a-zA-Z0-9]{36}\b/g,
];

// ============================================================================
// Sanitization Functions
// ============================================================================

/**
 * Remove code blocks from text
 */
export function removeCodeBlocks(text: string): string {
  return text.replace(CODE_BLOCK_PATTERN, " ").replace(INLINE_CODE_PATTERN, " ");
}

/**
 * Remove command-line content from text
 */
export function removeCommands(text: string): string {
  return text.replace(COMMAND_LINE_PATTERN, " ");
}

/**
 * Replace file paths with [PATH] placeholder
 */
export function maskPaths(text: string): string {
  return text.replace(FILE_PATH_PATTERN, "[PATH]");
}

/**
 * Replace URLs with [URL] placeholder
 */
export function maskUrls(text: string): string {
  return text.replace(URL_PATTERN, "[URL]");
}

/**
 * Replace email addresses with [EMAIL] placeholder
 */
export function maskEmails(text: string): string {
  return text.replace(EMAIL_PATTERN, "[EMAIL]");
}

/**
 * Replace IP addresses with [IP] placeholder
 */
export function maskIps(text: string): string {
  return text.replace(IPV4_PATTERN, "[IP]").replace(IPV6_PATTERN, "[IP]");
}

/**
 * Replace potential secrets with [SECRET] placeholder
 */
export function maskSecrets(text: string): string {
  let result = text;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, "[SECRET]");
  }
  return result;
}

/**
 * Truncate text to maximum length, adding [TRUNCATED] marker
 */
export function truncateText(
  text: string,
  maxLength: number = DEFAULT_CONFIG.maxLineChars
): string {
  if (text.length <= maxLength) {
    return text;
  }
  // Leave room for " [TRUNCATED]" (12 chars)
  const cutoff = maxLength - 12;
  return text.slice(0, cutoff) + " [TRUNCATED]";
}

/**
 * Normalize whitespace (collapse multiple spaces/newlines)
 */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// ============================================================================
// Main Sanitization Pipeline
// ============================================================================

/**
 * Options for sanitization
 */
export interface SanitizeOptions {
  maxLength?: number;
  removeCode?: boolean;
  removeCommands?: boolean;
  maskPaths?: boolean;
  maskUrls?: boolean;
  maskEmails?: boolean;
  maskIps?: boolean;
  maskSecrets?: boolean;
  truncate?: boolean;
}

const DEFAULT_SANITIZE_OPTIONS: Required<SanitizeOptions> = {
  maxLength: DEFAULT_CONFIG.maxLineChars,
  removeCode: true,
  removeCommands: true,
  maskPaths: true,
  maskUrls: true,
  maskEmails: true,
  maskIps: true,
  maskSecrets: true,
  truncate: true,
};

/**
 * Full sanitization pipeline for user messages
 *
 * Order matters:
 * 1. Remove code blocks first (may contain paths, URLs, etc.)
 * 2. Remove commands
 * 3. Mask sensitive content (paths, URLs, emails, IPs, secrets)
 * 4. Normalize whitespace
 * 5. Truncate if needed
 */
export function sanitize(
  text: string,
  options: SanitizeOptions = {}
): string {
  const opts = { ...DEFAULT_SANITIZE_OPTIONS, ...options };

  let result = text;

  // Step 1: Remove code blocks
  if (opts.removeCode) {
    result = removeCodeBlocks(result);
  }

  // Step 2: Remove commands
  if (opts.removeCommands) {
    result = removeCommands(result);
  }

  // Step 3: Mask sensitive content (order matters: URLs before paths!)
  if (opts.maskUrls) {
    result = maskUrls(result);
  }
  if (opts.maskPaths) {
    result = maskPaths(result);
  }
  if (opts.maskEmails) {
    result = maskEmails(result);
  }
  if (opts.maskIps) {
    result = maskIps(result);
  }
  if (opts.maskSecrets) {
    result = maskSecrets(result);
  }

  // Step 4: Normalize whitespace
  result = normalizeWhitespace(result);

  // Step 5: Truncate if needed
  if (opts.truncate) {
    result = truncateText(result, opts.maxLength);
  }

  return result;
}

/**
 * Check if a sanitized text contains any remaining sensitive patterns
 * Used for validation before including in samples
 */
export function containsSensitiveContent(text: string): boolean {
  // Check for any patterns that might have been missed
  if (FILE_PATH_PATTERN.test(text)) return true;
  if (URL_PATTERN.test(text)) return true;
  if (EMAIL_PATTERN.test(text)) return true;
  if (IPV4_PATTERN.test(text)) return true;

  // Check for code-like patterns
  if (/[{}();]/.test(text) && /[a-z]+\s*[({]/.test(text)) return true;

  // Check for potential secrets
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) return true;
  }

  return false;
}

/**
 * Get the list of filters that were applied during sanitization
 */
export function getAppliedFilters(options: SanitizeOptions = {}): string[] {
  const opts = { ...DEFAULT_SANITIZE_OPTIONS, ...options };
  const filters: string[] = ["user_messages_only"];

  if (opts.removeCode) filters.push("code_blocks_removed");
  if (opts.removeCommands) filters.push("commands_removed");
  if (opts.maskPaths) filters.push("paths_masked");
  if (opts.maskUrls) filters.push("urls_masked");
  if (opts.maskEmails) filters.push("emails_masked");
  if (opts.maskIps) filters.push("ips_masked");
  if (opts.maskSecrets) filters.push("secrets_masked");
  if (opts.truncate) filters.push("truncated_long_text");

  return filters;
}
