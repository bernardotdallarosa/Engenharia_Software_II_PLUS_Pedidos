import { describe, it, expect } from "vitest";
import { PLUS_AUTH_LOGIN_SUCCESS_EVENT } from "./shellAuthEvents.js";

describe("shellAuthEvents", () => {
  it("mantém o nome do evento alinhado ao MFE", () => {
    expect(PLUS_AUTH_LOGIN_SUCCESS_EVENT).toBe("plus-auth-login-success");
  });
});
