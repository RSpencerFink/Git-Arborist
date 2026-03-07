/**
 * Simple template engine for path templates.
 * Supports {{ variable }} and {{ variable | filter }} syntax.
 */

const FILTERS: Record<string, (input: string) => string> = {
  sanitize(input: string): string {
    return input
      .replace(/[^a-zA-Z0-9_\-/.]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  },
  lowercase(input: string): string {
    return input.toLowerCase();
  },
  uppercase(input: string): string {
    return input.toUpperCase();
  },
};

export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)(?:\s*\|\s*(\w+))?\s*\}\}/g, (_match, name, filter) => {
    const value = variables[name];
    if (value === undefined) {
      throw new Error(`Unknown template variable: ${name}`);
    }
    if (filter) {
      const fn = FILTERS[filter];
      if (!fn) {
        throw new Error(`Unknown template filter: ${filter}`);
      }
      return fn(value);
    }
    return value;
  });
}
