/**
 * @fileoverview Unit tests for utility functions.
 */

import { describe, it, expect } from 'vitest';

/**
 * cleanJsonString - extracted for testing since it's private in geminiService.
 * This test validates the logic that would be in the actual function.
 */
function cleanJsonString(jsonStr: string): string {
  let cleaned = jsonStr.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleaned.match(fenceRegex);
  if (match && match[2]) {
    cleaned = match[2].trim();
  }
  return cleaned;
}

describe('cleanJsonString', () => {
  it('should return plain JSON unchanged', () => {
    const input = '{"key": "value"}';
    expect(cleanJsonString(input)).toBe('{"key": "value"}');
  });

  it('should strip ```json fences', () => {
    const input = '```json\n{"key": "value"}\n```';
    expect(cleanJsonString(input)).toBe('{"key": "value"}');
  });

  it('should strip ``` fences without language', () => {
    const input = '```\n{"key": "value"}\n```';
    expect(cleanJsonString(input)).toBe('{"key": "value"}');
  });

  it('should handle multiline JSON inside fences', () => {
    const input = '```json\n{\n  "tables": [\n    {"name": "Users"}\n  ]\n}\n```';
    const result = cleanJsonString(input);
    expect(result).toContain('"tables"');
    expect(result).not.toContain('```');
  });

  it('should trim whitespace', () => {
    const input = '   {"key": "value"}   ';
    expect(cleanJsonString(input)).toBe('{"key": "value"}');
  });

  it('should handle empty string', () => {
    expect(cleanJsonString('')).toBe('');
  });

  it('should preserve content when no fences present', () => {
    const complexJson = JSON.stringify({
      description: 'Test schema',
      tables: [
        { name: 'Users', columns: [{ name: 'id', type: 'INT' }] },
      ],
    });
    expect(cleanJsonString(complexJson)).toBe(complexJson);
  });
});

describe('JSON to CSV conversion logic', () => {
  /**
   * jsonToCsv - simplified version for testing
   */
  function jsonToCsv(jsonData: string): string {
    try {
      const data = JSON.parse(jsonData);
      if (!data || typeof data !== 'object') return 'Invalid data format';

      const tableKey = Object.keys(data).find(key => Array.isArray(data[key]));
      if (!tableKey) return 'No table data found to convert.';

      const tableData = data[tableKey];
      if (tableData.length === 0) return 'Table is empty.';

      const headers = Object.keys(tableData[0]);
      const csvRows = [headers.join(',')];

      for (const row of tableData) {
        const values = headers.map(header => {
          const val = row[header];
          const stringVal = val === null || val === undefined ? '' : String(val);
          const escaped = stringVal.replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }
      return csvRows.join('\n');
    } catch (e) {
      return 'Error converting data to CSV.';
    }
  }

  it('should convert simple JSON to CSV', () => {
    const json = JSON.stringify({
      Users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ],
    });
    const result = jsonToCsv(json);
    expect(result).toContain('id,name');
    expect(result).toContain('"1","John"');
    expect(result).toContain('"2","Jane"');
  });

  it('should handle empty table', () => {
    const json = JSON.stringify({ Users: [] });
    expect(jsonToCsv(json)).toBe('Table is empty.');
  });

  it('should handle missing table data', () => {
    const json = JSON.stringify({ config: { setting: true } });
    expect(jsonToCsv(json)).toBe('No table data found to convert.');
  });

  it('should escape quotes in values', () => {
    const json = JSON.stringify({
      Users: [{ name: 'John "Johnny" Doe' }],
    });
    const result = jsonToCsv(json);
    expect(result).toContain('""Johnny""');
  });

  it('should handle null and undefined values', () => {
    const json = JSON.stringify({
      Users: [{ id: 1, name: null }],
    });
    const result = jsonToCsv(json);
    expect(result).toContain('""');
  });

  it('should return error for invalid JSON', () => {
    expect(jsonToCsv('not valid json')).toBe('Error converting data to CSV.');
  });
});
