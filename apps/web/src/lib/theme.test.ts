import { themeBootScript } from "./theme";

/* Runs the real <head> script against a stubbed matchMedia. */
function boot(stored: string | null, systemLight: boolean | null) {
  localStorage.clear();
  if (stored !== null) localStorage.setItem("wp-theme", stored);
  delete document.documentElement.dataset.theme;
  window.matchMedia = ((q: string) => ({ matches: systemLight === true && q.includes("light"), media: q })) as unknown as typeof window.matchMedia;
  if (systemLight === null) (window as { matchMedia?: unknown }).matchMedia = undefined;
  new Function(themeBootScript)();
  return document.documentElement.dataset.theme;
}

describe("theme boot script", () => {
  it("follows a light system setting on the first visit", () => {
    expect(boot(null, true)).toBe("light");
  });
  it("follows a dark system setting", () => {
    expect(boot(null, false)).toBe("dark");
  });
  it("falls back to dark when the browser cannot tell", () => {
    expect(boot(null, null)).toBe("dark");
  });
  it("a stored choice wins over the system", () => {
    expect(boot("dark", true)).toBe("dark");
    expect(boot("light", false)).toBe("light");
  });
  it("ignores a junk stored value", () => {
    expect(boot("blue", true)).toBe("light");
  });
});
