import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "./auth-form";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: push }) }));
const resend = vi.fn(async () => ({ ok: true as const, checkInbox: true as const }));
vi.mock("@/lib/auth", () => ({
  signUp: vi.fn(async () => ({ ok: true, checkInbox: true })),
  logIn: vi.fn(async () => ({ ok: false, field: "form", message: "Confirm your email first. Check your inbox.", canResend: true })),
  resendConfirmation: (...a: unknown[]) => resend(...(a as [])),
}));

const renderForm = (mode: "login" | "signup") =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthForm mode={mode} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  push.mockReset();
  resend.mockClear();
});

describe("AuthForm with email confirmation (R1.1)", () => {
  it("sign up shows Check your inbox instead of going to setup", async () => {
    renderForm("signup");
    await userEvent.type(screen.getByLabelText("Full name"), "Ana");
    await userEvent.type(screen.getByLabelText("Email"), "ana@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "longenough1");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("unconfirmed log in offers to send a new link", async () => {
    renderForm("login");
    await userEvent.type(screen.getByLabelText("Email"), "ana@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    await userEvent.click(await screen.findByRole("button", { name: "Send a new link" }));
    expect(resend).toHaveBeenCalledWith("ana@example.com");
    expect(await screen.findByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
  });

  it("an expired link explains itself on the log in page", async () => {
    window.history.replaceState(null, "", "/login?error=link_expired");
    renderForm("login");
    expect(await screen.findByText(/This link expired/)).toBeInTheDocument();
    window.history.replaceState(null, "", "/");
  });
});
