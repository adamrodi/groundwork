import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Settings from "@/pages/Settings";
import { makeChain } from "@/tests/helpers";

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockFrom, mockInvoke } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockInvoke: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    functions: { invoke: mockInvoke },
  },
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderPage(path = "/settings") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Settings />
    </MemoryRouter>,
  );
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const profileNoStripe = {
  id: "user-1",
  stripe_account_id: null,
  created_at: "2025-01-01T00:00:00Z",
};
const profileWithStripe = {
  id: "user-1",
  stripe_account_id: "acct_123",
  created_at: "2025-01-01T00:00:00Z",
};

// ── window.location workaround for jsdom ─────────────────────────────────────

const originalLocation = window.location;

beforeEach(() => {
  mockFrom.mockReset();
  mockInvoke.mockReset();
  // @ts-expect-error — jsdom workaround for window.location.href assignment
  delete window.location;
  // @ts-expect-error
  window.location = { ...originalLocation, href: "" } as Location;
});

afterEach(() => {
  // @ts-expect-error
  window.location = originalLocation;
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Settings", () => {
  it("shows connect button when Stripe is not connected", async () => {
    mockFrom.mockReturnValue(makeChain({ data: profileNoStripe, error: null }));
    renderPage();

    expect(
      await screen.findByRole("button", { name: /connect payment account/i }),
    ).toBeInTheDocument();
  });

  it("shows connected indicator when Stripe is connected", async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: profileWithStripe, error: null }),
    );
    renderPage();

    expect(
      await screen.findByText(/payment account connected/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /connect payment account/i }),
    ).not.toBeInTheDocument();
  });

  it("calls stripe-connect-onboard on connect click", async () => {
    const user = userEvent.setup();
    mockFrom.mockReturnValue(makeChain({ data: profileNoStripe, error: null }));
    mockInvoke.mockResolvedValue({
      data: { url: "https://connect.stripe.com/setup/xxx" },
      error: null,
    });
    renderPage();

    await screen.findByRole("button", { name: /connect payment account/i });
    await user.click(
      screen.getByRole("button", { name: /connect payment account/i }),
    );

    expect(mockInvoke).toHaveBeenCalledWith("stripe-connect-onboard");
    await waitFor(() => {
      expect(window.location.href).toBe("https://connect.stripe.com/setup/xxx");
    });
  });

  it("shows success banner with ?stripe=connected", async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: profileWithStripe, error: null }),
    );
    renderPage("/settings?stripe=connected");

    expect(
      await screen.findByText(/payment account connected successfully/i),
    ).toBeInTheDocument();
  });
});
