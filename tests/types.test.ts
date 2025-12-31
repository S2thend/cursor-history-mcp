import { describe, it, expect } from 'vitest';
import { MCP_ERROR_CODES } from '../src/types.js';

describe('MCP_ERROR_CODES', () => {
  it('should have unique error codes', () => {
    const codes = Object.values(MCP_ERROR_CODES);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('should have negative error codes', () => {
    const codes = Object.values(MCP_ERROR_CODES);
    for (const code of codes) {
      expect(code).toBeLessThan(0);
    }
  });

  it('should contain expected error types', () => {
    expect(MCP_ERROR_CODES.DATABASE_NOT_FOUND).toBeDefined();
    expect(MCP_ERROR_CODES.SESSION_NOT_FOUND).toBeDefined();
    expect(MCP_ERROR_CODES.BACKUP_FAILED).toBeDefined();
  });
});
