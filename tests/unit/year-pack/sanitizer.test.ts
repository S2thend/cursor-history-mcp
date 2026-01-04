/**
 * Unit tests for sanitizer module
 */

import { describe, it, expect } from "vitest";
import {
  removeCodeBlocks,
  removeCommands,
  maskPaths,
  maskUrls,
  maskEmails,
  maskIps,
  maskSecrets,
  truncateText,
  sanitize,
  containsSensitiveContent,
} from "../../../src/tools/year-pack/sanitizer.js";

describe("sanitizer", () => {
  describe("removeCodeBlocks", () => {
    it("should remove markdown code blocks", () => {
      const input = "Hello ```javascript\nconst x = 1;\n``` world";
      expect(removeCodeBlocks(input)).toBe("Hello   world");
    });

    it("should remove inline code", () => {
      const input = "Use `npm install` to install";
      expect(removeCodeBlocks(input)).toBe("Use   to install");
    });

    it("should handle multiple code blocks", () => {
      const input = "```js\na\n``` and ```py\nb\n```";
      expect(removeCodeBlocks(input)).toBe("  and  ");
    });
  });

  describe("removeCommands", () => {
    it("should remove $ prefixed commands", () => {
      const input = "Run this:\n$ npm install\nThen continue";
      expect(removeCommands(input)).toBe("Run this:\n \nThen continue");
    });

    it("should remove npm/git/python commands", () => {
      const input = "npm install express\ngit clone repo\npython script.py";
      const result = removeCommands(input);
      expect(result).not.toContain("npm install");
      expect(result).not.toContain("git clone");
      expect(result).not.toContain("python script");
    });
  });

  describe("maskPaths", () => {
    it("should mask Unix paths", () => {
      const input = "Look at /usr/local/bin/node for the file";
      expect(maskPaths(input)).toBe("Look at [PATH] for the file");
    });

    it("should mask relative paths", () => {
      const input = "Check ./src/index.ts and ../package.json";
      expect(maskPaths(input)).toBe("Check [PATH] and [PATH]");
    });

    it("should mask Windows paths", () => {
      const input = "Located at C:\\Users\\name\\Documents";
      expect(maskPaths(input)).toBe("Located at [PATH]");
    });

    it("should mask home directory paths", () => {
      const input = "My config is at ~/config.json";
      expect(maskPaths(input)).toBe("My config is at [PATH]");
    });
  });

  describe("maskUrls", () => {
    it("should mask http URLs", () => {
      const input = "Visit http://example.com for more";
      expect(maskUrls(input)).toBe("Visit [URL] for more");
    });

    it("should mask https URLs", () => {
      const input = "See https://github.com/user/repo";
      expect(maskUrls(input)).toBe("See [URL]");
    });

    it("should mask www URLs", () => {
      const input = "Go to www.example.com";
      expect(maskUrls(input)).toBe("Go to [URL]");
    });
  });

  describe("maskEmails", () => {
    it("should mask email addresses", () => {
      const input = "Contact me at user@example.com";
      expect(maskEmails(input)).toBe("Contact me at [EMAIL]");
    });

    it("should handle multiple emails", () => {
      const input = "From a@b.com to c@d.org";
      expect(maskEmails(input)).toBe("From [EMAIL] to [EMAIL]");
    });
  });

  describe("maskIps", () => {
    it("should mask IPv4 addresses", () => {
      const input = "Server at 192.168.1.1 is down";
      expect(maskIps(input)).toBe("Server at [IP] is down");
    });

    it("should mask localhost IP", () => {
      const input = "Running on 127.0.0.1:3000";
      expect(maskIps(input)).toBe("Running on [IP]:3000");
    });
  });

  describe("maskSecrets", () => {
    it("should mask API keys with common prefixes", () => {
      const input = "Use sk_live_abc123def456ghi789jkl012345678901234";
      expect(maskSecrets(input)).toBe("Use [SECRET]");
    });

    it("should mask long hex strings", () => {
      const input = "Hash: 0123456789abcdef0123456789abcdef01234567";
      expect(maskSecrets(input)).toBe("Hash: [SECRET]");
    });

    it("should mask GitHub tokens", () => {
      const input = "Token: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
      expect(maskSecrets(input)).toBe("Token: [SECRET]");
    });
  });

  describe("truncateText", () => {
    it("should not truncate short text", () => {
      const input = "Short text";
      expect(truncateText(input, 100)).toBe("Short text");
    });

    it("should truncate long text with marker", () => {
      const input = "A".repeat(300);
      const result = truncateText(input, 280);
      expect(result.length).toBe(280);
      expect(result).toContain("[TRUNCATED]");
    });
  });

  describe("sanitize", () => {
    it("should apply all sanitization steps", () => {
      const input =
        "Check /path/to/file.txt or visit https://example.com and contact test@email.com";
      const result = sanitize(input);
      expect(result).not.toContain("/path/to");
      expect(result).not.toContain("https://");
      expect(result).not.toContain("@email.com");
      expect(result).toContain("[PATH]");
      expect(result).toContain("[URL]");
      expect(result).toContain("[EMAIL]");
    });

    it("should normalize whitespace", () => {
      const input = "Multiple   spaces\n\nand\nnewlines";
      const result = sanitize(input);
      expect(result).not.toContain("  ");
      expect(result).not.toContain("\n");
    });
  });

  describe("containsSensitiveContent", () => {
    it("should detect remaining paths", () => {
      expect(containsSensitiveContent("/usr/bin/node")).toBe(true);
    });

    it("should detect remaining URLs", () => {
      expect(containsSensitiveContent("https://example.com")).toBe(true);
    });

    it("should return false for clean text", () => {
      expect(containsSensitiveContent("How do I use TypeScript?")).toBe(false);
    });
  });
});
