import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../ui/button";

describe("Button component", () => {
  it("renders button with children text", () => {
    render(<Button>Haz clic aquí</Button>);
    const button = screen.getByRole("button", { name: /haz clic aquí/i });
    expect(button).toBeInTheDocument();
  });

  it("applies default variant styling", () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole("button", { name: /default/i });
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("text-primary-foreground");
  });

  it("applies outline variant styling", () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole("button", { name: /outline/i });
    expect(button).toHaveClass("border");
    expect(button).toHaveClass("border-input");
    expect(button).toHaveClass("bg-background");
  });

  it("applies destructive variant styling", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button", { name: /delete/i });
    expect(button).toHaveClass("bg-destructive");
    expect(button).toHaveClass("text-destructive-foreground");
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole("button", { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("disables button when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button", { name: /disabled/i });
    expect(button).toBeDisabled();
  });

  it("renders asChild as an anchor element", () => {
    render(
      <Button asChild>
        <a href="/session/new">Link</a>
      </Button>
    );
    const link = screen.getByRole("link", { name: /link/i });
    expect(link).toHaveAttribute("href", "/session/new");
  });
});
