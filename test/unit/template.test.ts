import { describe, expect, test } from "bun:test";
import { renderTemplate } from "../../src/utils/template.ts";

describe("renderTemplate", () => {
  test("replaces simple variables", () => {
    expect(renderTemplate("{{ branch }}", { branch: "main" })).toBe("main");
  });

  test("replaces variables with sanitize filter", () => {
    expect(
      renderTemplate("{{ branch | sanitize }}", {
        branch: "feature/my-branch",
      }),
    ).toBe("feature/my-branch");
  });

  test("sanitize removes special characters", () => {
    expect(
      renderTemplate("{{ branch | sanitize }}", {
        branch: "feat@weird#chars!",
      }),
    ).toBe("feat-weird-chars");
  });

  test("supports multiple variables", () => {
    expect(
      renderTemplate("{{ branch }}-{{ branch | sanitize }}", {
        branch: "test",
      }),
    ).toBe("test-test");
  });

  test("throws on unknown variable", () => {
    expect(() => renderTemplate("{{ unknown }}", {})).toThrow(
      "Unknown template variable",
    );
  });

  test("throws on unknown filter", () => {
    expect(() =>
      renderTemplate("{{ branch | nope }}", { branch: "x" }),
    ).toThrow("Unknown template filter");
  });

  test("lowercase filter", () => {
    expect(renderTemplate("{{ branch | lowercase }}", { branch: "MAIN" })).toBe(
      "main",
    );
  });

  test("uppercase filter", () => {
    expect(renderTemplate("{{ branch | uppercase }}", { branch: "main" })).toBe(
      "MAIN",
    );
  });
});
