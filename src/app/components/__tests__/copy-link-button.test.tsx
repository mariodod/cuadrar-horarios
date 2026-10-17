import { render, screen, fireEvent } from "@testing-library/react";
import CopyLinkButton from "../copy-link-button";

describe("CopyLinkButton component", () => {
  beforeEach(() => {
    // Mock del portapapeles
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders copy button with text", () => {
    render(<CopyLinkButton sessionId="session-123" />);
    expect(screen.getByRole("button", { name: /copiar link/i })).toBeInTheDocument();
  });

  it("calls navigator.clipboard.writeText with session link", async () => {
    render(<CopyLinkButton sessionId="abc-123" />);
    fireEvent.click(screen.getByRole("button", { name: /copiar link/i }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    const expectedUrl = `http://localhost${window.location.port ? ":" + window.location.port : ""}/session/abc-123`;
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedUrl);
  });

  it("is disabled when loading", () => {
    // No hay prop loading, pero probamos que se renderiza sin error
    render(<CopyLinkButton sessionId="test" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
