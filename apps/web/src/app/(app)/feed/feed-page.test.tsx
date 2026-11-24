import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resetDemoStore, setDemoSession } from "@/lib/api/mock/server";
import { ToastProvider } from "@/lib/toast";
import FeedPage from "./page";

let search = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/feed",
  useSearchParams: () => search,
}));

function renderPage(url: string) {
  window.history.replaceState(null, "", url);
  search = new URLSearchParams(url.split("?")[1] ?? "");
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <FeedPage />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  resetDemoStore(true);
  setDemoSession({ email: "rani@example.com", name: "Rani Putri" });
});

/* Four states per screen. */
describe("Feed page", () => {
  it("success: shows ranked cards and the count line", async () => {
    renderPage("/feed");
    expect(await screen.findByRole("heading", { name: "Frontend Developer Intern" })).toBeInTheDocument();
    expect(screen.getByText(/open to you within 25 km of home or online/)).toBeInTheDocument();
  });

  it("loading: shows a skeleton first", async () => {
    renderPage("/feed");
    expect(await screen.findByLabelText("Loading opportunities")).toHaveAttribute("aria-busy", "true");
  });

  it("empty: explains and offers actions", async () => {
    renderPage("/feed?demo=empty");
    expect(await screen.findByText("Nothing matches")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Widen your radius" })).toHaveAttribute("href", "/radius");
  });

  it("error: specific message with Retry", async () => {
    renderPage("/feed?demo=error");
    // One automatic retry on 5xx comes first, then the visible error with Retry.
    expect(await screen.findByText("Couldn't load opportunities.", {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("empty search offers Clear search inside the empty state (R2.3)", async () => {
    renderPage("/feed?q=zzzz");
    expect(await screen.findByText("Nothing matches here")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Clear search" })).toHaveLength(2);
  });

  it("?open= opens the breakdown once; closing it stays closed after a refetch", async () => {
    renderPage("/feed?open=c1");
    const hide = await screen.findByRole("button", { name: "Hide breakdown" });
    await userEvent.click(hide);
    expect(screen.queryByRole("button", { name: "Hide breakdown" })).toBeNull();
    await userEvent.click(screen.getAllByRole("button", { name: "✓ Saved · reminders on" })[0]);
    await new Promise((r) => setTimeout(r, 700));
    expect(screen.queryByRole("button", { name: "Hide breakdown" })).toBeNull();
  });

  it("category filter shows only that category", async () => {
    renderPage("/feed?category=seminar");
    expect(await screen.findByRole("heading", { name: "Data Analytics Workshop" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Frontend Developer Intern" })).toBeNull();
    expect(screen.getByRole("button", { name: "Seminars" })).toHaveAttribute("aria-pressed", "true");
  });
});
