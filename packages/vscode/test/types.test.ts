import { describe, it, expect } from "vitest";
import { isArboristError } from "../src/cli/types";

describe("isArboristError", () => {
  it("returns true for valid error objects", () => {
    expect(
      isArboristError({ error: "something failed", code: "COMMAND_ERROR" }),
    ).toBe(true);
  });

  it("returns false for null", () => {
    expect(isArboristError(null)).toBe(false);
  });

  it("returns false for arrays", () => {
    expect(isArboristError([])).toBe(false);
  });

  it("returns false for objects missing code", () => {
    expect(isArboristError({ error: "oops" })).toBe(false);
  });

  it("returns false for objects missing error", () => {
    expect(isArboristError({ code: "ERR" })).toBe(false);
  });

  it("returns false for valid worktree data", () => {
    expect(
      isArboristError({
        path: "/foo",
        branch: "main",
        head: "abc",
        isMain: true,
        isDetached: false,
        isCurrent: true,
        status: null,
      }),
    ).toBe(false);
  });
});
