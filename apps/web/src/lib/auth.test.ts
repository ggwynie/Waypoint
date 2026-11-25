import { authMessage } from "./auth";

/* Supabase Auth errors → the messages the sign-up and log-in flows require. */
describe("authMessage", () => {
  it("taken email", () => {
    expect(authMessage({ code: "user_already_exists", status: 422 }, "signup")).toMatchObject({ field: "email", message: "An account with this email exists. Log in instead." });
    expect(authMessage({ message: "User already registered", status: 400 }, "signup").field).toBe("email");
  });
  it("weak password", () => {
    expect(authMessage({ code: "weak_password", status: 422 }, "signup").field).toBe("password");
  });
  it("wrong login and unconfirmed email", () => {
    expect(authMessage({ code: "invalid_credentials", status: 400 }, "login")).toMatchObject({ field: "password", message: "Email or password is wrong." });
    expect(authMessage({ code: "email_not_confirmed", status: 400 }, "login")).toMatchObject({ field: "form", canResend: true });
  });
  it("rate limit", () => {
    expect(authMessage({ code: "over_email_send_rate_limit", status: 429 }, "signup").message).toMatch(/Too many tries/);
  });
  it("network and server errors", () => {
    expect(authMessage({ message: "Failed to fetch" }, "login").message).toBe("Couldn't reach the server. Try again.");
    expect(authMessage({ status: 503 }, "login").message).toBe("Couldn't reach the server. Try again.");
  });
});
