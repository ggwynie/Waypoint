import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { FeedItem } from "@/lib/api";
import { OpportunityCard } from "./feed/opportunity-card";
import { FitRing } from "./ui/fit-ring";
import { HowFitDialog } from "./ui/how-fit-dialog";

const item: FeedItem = {
  id: "i1",
  title: "Frontend Developer Intern",
  category: "internship",
  organizer: "Startup · 3 months",
  mode: "onsite",
  registration_deadline: "2026-12-02T16:59:59Z",
  days_left: 5,
  distance_km: 6,
  in_radius: true,
  eligible: false,
  block_reason: "For semester 7 and up. You are in semester 6.",
  fit: 88,
  fit_parts: [
    { key: "major", points: 30, max: 30, explain: "Computer Science is listed by the organizer: full 30." },
    { key: "match", points: 22.5, max: 30, explain: "match text" },
    { key: "distance", points: 17.6, max: 20, explain: "distance text" },
    { key: "prep_time", points: 10, max: 10, explain: "prep text" },
    { key: "trust", points: 8, max: 10, explain: "trust text" },
  ],
  why: "Your major is listed, matches Software, 6 km from home.",
  trust_level: "corroborated",
  primary_source_url: "https://careers.example.com/x",
  source_host: "careers.example.com",
  last_verified_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
  topic_tags: ["software"],
  required_skill_tags: ["javascript"],
  min_semester: 7,
  is_saved: false,
  lat: -6.1,
  lng: 106.8,
};

function Card(props: Partial<React.ComponentProps<typeof OpportunityCard>> & { item?: FeedItem }) {
  const [open, setOpen] = useState(false);
  return (
    <OpportunityCard item={props.item ?? item} origin="home" open={open} onToggleOpen={() => setOpen(!open)} onToggleSave={props.onToggleSave ?? (() => {})} onHide={props.onHide ?? (() => {})} labelOf={(s) => s.toUpperCase()} />
  );
}

describe("OpportunityCard", () => {
  it("shows the API's fit, why, trust label, deadline, block reason and Checked time", () => {
    render(<Card />);
    expect(screen.getByRole("img", { name: "Fit score 88 of 100" })).toBeInTheDocument();
    expect(screen.getByText(item.why)).toBeInTheDocument();
    expect(screen.getByText("Confirmed by 2 sources")).toBeInTheDocument();
    expect(screen.getByText(/5 days left/)).toBeInTheDocument();
    expect(screen.getByText(item.block_reason!)).toBeInTheDocument();
    expect(screen.getByText("Checked 2 hours ago")).toBeInTheDocument();
    expect(screen.getByText("Semester 7+")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View original on careers.example.com" })).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("opens the five-part breakdown with points from fit_parts", async () => {
    render(<Card />);
    const btn = screen.getByRole("button", { name: "How 88 is built" });
    await userEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("22.5 / 30")).toBeInTheDocument();
    expect(screen.getByText("17.6 / 20")).toBeInTheDocument();
    expect(screen.getByText("88 / 100")).toBeInTheDocument();
  });

  it("calls save and not relevant", async () => {
    const save = vi.fn();
    const hide = vi.fn();
    render(<Card onToggleSave={save} onHide={hide} />);
    await userEvent.click(screen.getByRole("button", { name: "Save + remind me" }));
    await userEvent.click(screen.getByRole("button", { name: "Mark Frontend Developer Intern as not relevant" }));
    expect(save).toHaveBeenCalledOnce();
    expect(hide).toHaveBeenCalledOnce();
  });

  it("marks items outside the radius with the word, not colour only", () => {
    render(<Card item={{ ...item, in_radius: false, eligible: true, block_reason: null }} />);
    expect(screen.getByText(/OUTSIDE YOUR RADIUS/)).toBeInTheDocument();
  });

  it("renders scraped text as plain text, never HTML", () => {
    render(<Card item={{ ...item, title: "<img src=x onerror=alert(1)>" }} />);
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });
});

describe("FitRing", () => {
  it("labels the score for screen readers", () => {
    render(<FitRing fit={73} category="seminar" />);
    expect(screen.getByRole("img", { name: "Fit score 73 of 100" })).toHaveTextContent("73");
  });
});

describe("HowFitDialog", () => {
  it("is a labelled dialog that closes on Escape and returns focus", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            How Fit is scored
          </button>
          <HowFitDialog open={open} onClose={() => setOpen(false)} />
        </>
      );
    }
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "How Fit is scored" });
    await userEvent.click(opener);
    expect(screen.getByRole("dialog", { name: "How Fit is scored" })).toBeInTheDocument();
    expect(screen.getByText(/Confirmed by 2 sources: 8/)).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(opener).toHaveFocus();
  });
});
