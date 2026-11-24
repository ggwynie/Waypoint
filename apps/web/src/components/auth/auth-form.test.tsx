import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "./auth-form";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: push }) }));

function renderForm(mode: "login" | "signup") {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthForm mode={mode} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  push.mockReset();
  localStorage.clear();
});

describe("AuthForm", () => {
  it("shows field errors with role=alert and aria-invalid on empty submit", async () => {
    renderForm("signup");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByText("Enter your name.")).toHaveAttribute("role", "alert");
    expect(screen.getByText("Enter your email.")).toBeInTheDocument();
    expect(screen.getByText("Use at least 8 characters.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(push).not.toHaveBeenCalled();
  });

  it("explains a bad email format", async () => {
    renderForm("login");
    await userEvent.type(screen.getByLabelText("Email"), "rani@");
    await userEvent.type(screen.getByLabelText("Password"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByText("Check the email format, for example name@example.com.")).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    renderForm("login");
    const pass = screen.getByLabelText("Password");
    expect(pass).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(pass).toHaveAttribute("type", "text");
  });

  it("tells the user when the email already has an account", async () => {
    renderForm("signup");
    await userEvent.type(screen.getByLabelText("Full name"), "Rani");
    await userEvent.type(screen.getByLabelText("Email"), "rani@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "longenough");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("An account with this email exists. Log in instead.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("sends a new account to setup", async () => {
    renderForm("signup");
    await userEvent.type(screen.getByLabelText("Full name"), "Ana");
    await userEvent.type(screen.getByLabelText("Email"), "ana@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "longenough");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/setup"));
  });
});
