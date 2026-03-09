import { describe, it, expect } from "vitest";
import { isGwError } from "../src/cli/types";

describe("isGwError", () => {
  it("returns true for valid error objects", () => {
    expect(
      isGwError({ error: "something failed", code: "COMMAND_ERROR" }),
    ).toBe(true);
  });

  it("returns false for null", () => {
    expect(isGwError(null)).toBe(false);
  });

  it("returns false for arrays", () => {
    expect(isGwError([])).toBe(false);
  });

  it("returns false for objects missing code", () => {
    expect(isGwError({ error: "oops" })).toBe(false);
  });

  it("returns false for objects missing error", () => {
    expect(isGwError({ code: "ERR" })).toBe(false);
  });

  it("returns false for valid worktree data", () => {
    expect(
      isGwError({
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
