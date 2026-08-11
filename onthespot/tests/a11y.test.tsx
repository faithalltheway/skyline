import { describe, expect, it, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { AccessibilityBreakdown } from "@/components/events/AccessibilityBreakdown";
import { Badge } from "@/components/ui/Badge";
import { AccessibilityStateBadge } from "@/components/ui/AccessibilityStateBadge";
import { ProgressSteps } from "@/components/ui/ProgressSteps";

beforeAll(() => {
  expect.extend(toHaveNoViolations);
});

describe("accessibility (axe)", () => {
  it("AccessibilityBreakdown has no detectable a11y violations", async () => {
    const { container } = render(
      <AccessibilityBreakdown
        accessibility={[
          { feature: "WHEELCHAIR_ACCESSIBLE", state: "CONFIRMED", note: null },
          { feature: "ASL_INTERPRETATION", state: "NOT_AVAILABLE", note: null },
          { feature: "CAPTIONS", state: "UNKNOWN", note: null },
        ]}
        hostName="Test Organization"
        lastVerifiedAt={new Date()}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("status badges have no detectable a11y violations and never rely on color alone", async () => {
    const { container, getByText } = render(
      <div>
        <Badge tone="confirmed">Confirmed</Badge>
        <AccessibilityStateBadge state="CONFIRMED" />
        <AccessibilityStateBadge state="NOT_AVAILABLE" />
        <AccessibilityStateBadge state="UNKNOWN" />
      </div>,
    );
    // Each state must carry a text label, not just a color — this is what
    // keeps the accessibility badges usable without relying on color alone.
    expect(getByText("Not available")).toBeInTheDocument();
    expect(getByText("Not confirmed")).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("ProgressSteps wizard indicator has no detectable a11y violations", async () => {
    const { container } = render(<ProgressSteps steps={["Basic info", "Location", "Review"]} currentStep={1} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
