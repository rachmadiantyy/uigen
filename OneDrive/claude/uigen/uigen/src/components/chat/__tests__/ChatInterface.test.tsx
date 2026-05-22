import { test, expect, vi, afterEach, beforeEach, describe } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { forwardRef } from "react";
import { ChatInterface } from "../ChatInterface";
import { useChat } from "@/lib/contexts/chat-context";

vi.mock("@/lib/contexts/chat-context", () => ({
  useChat: vi.fn(),
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: forwardRef(({ children, className }: any, ref: any) => (
    <div ref={ref} className={className}>
      <div data-radix-scroll-area-viewport>{children}</div>
    </div>
  )),
}));

vi.mock("../MessageList", () => ({
  MessageList: ({ messages, isLoading }: any) => (
    <div data-testid="message-list">
      {messages.length} messages, loading: {isLoading.toString()}
    </div>
  ),
}));

vi.mock("../MessageInput", () => ({
  MessageInput: ({ input, handleInputChange, handleSubmit, isLoading }: any) => (
    <div data-testid="message-input">
      <input
        value={input}
        onChange={handleInputChange}
        data-testid="input"
        disabled={isLoading}
      />
      <button onClick={handleSubmit} disabled={isLoading} data-testid="submit">
        Submit
      </button>
    </div>
  ),
}));

const mockHandleInputChange = vi.fn();
const mockHandleSubmit = vi.fn();

const defaultChat = {
  messages: [],
  input: "",
  handleInputChange: mockHandleInputChange,
  handleSubmit: mockHandleSubmit,
  status: "idle" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  (useChat as any).mockReturnValue(defaultChat);
});

afterEach(() => {
  cleanup();
});

describe("rendering", () => {
  test("renders message list and input", () => {
    render(<ChatInterface />);
    expect(screen.getByTestId("message-list")).toBeDefined();
    expect(screen.getByTestId("message-input")).toBeDefined();
  });

  test("renders with correct layout classes", () => {
    const { container } = render(<ChatInterface />);
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv.className).toContain("flex");
    expect(mainDiv.className).toContain("flex-col");
    expect(mainDiv.className).toContain("h-full");
    expect(mainDiv.className).toContain("p-4");
    expect(mainDiv.className).toContain("overflow-hidden");
  });

  test("input wrapper has correct layout classes", () => {
    render(<ChatInterface />);
    const inputWrapper = screen.getByTestId("message-input").parentElement;
    expect(inputWrapper?.className).toContain("mt-4");
    expect(inputWrapper?.className).toContain("flex-shrink-0");
  });

  test("renders empty message list", () => {
    render(<ChatInterface />);
    expect(screen.getByTestId("message-list").textContent).toContain("0 messages");
  });

  test("renders with multiple messages", () => {
    (useChat as any).mockReturnValue({
      ...defaultChat,
      messages: [
        { id: "1", role: "user", content: "Hello" },
        { id: "2", role: "assistant", content: "Hi!" },
        { id: "3", role: "user", content: "How are you?" },
      ],
    });
    render(<ChatInterface />);
    expect(screen.getByTestId("message-list").textContent).toContain("3 messages");
  });

  test("passes current input value to MessageInput", () => {
    (useChat as any).mockReturnValue({ ...defaultChat, input: "Hello world" });
    render(<ChatInterface />);
    expect(screen.getByTestId("input")).toHaveProperty("value", "Hello world");
  });
});

describe("MessageList isLoading prop", () => {
  test("is true only when status is streaming", () => {
    (useChat as any).mockReturnValue({ ...defaultChat, status: "streaming" });
    render(<ChatInterface />);
    expect(screen.getByTestId("message-list").textContent).toContain("loading: true");
  });

  test("is false when status is idle", () => {
    render(<ChatInterface />);
    expect(screen.getByTestId("message-list").textContent).toContain("loading: false");
  });

  test("is false when status is submitted", () => {
    (useChat as any).mockReturnValue({ ...defaultChat, status: "submitted" });
    render(<ChatInterface />);
    expect(screen.getByTestId("message-list").textContent).toContain("loading: false");
  });

  test("is false when status is error", () => {
    (useChat as any).mockReturnValue({ ...defaultChat, status: "error" });
    render(<ChatInterface />);
    expect(screen.getByTestId("message-list").textContent).toContain("loading: false");
  });
});

describe("MessageInput isLoading prop", () => {
  test("is false when status is idle", () => {
    render(<ChatInterface />);
    expect(screen.getByTestId("submit")).toHaveProperty("disabled", false);
    expect(screen.getByTestId("input")).toHaveProperty("disabled", false);
  });

  test("is true when status is submitted", () => {
    (useChat as any).mockReturnValue({ ...defaultChat, status: "submitted" });
    render(<ChatInterface />);
    expect(screen.getByTestId("submit")).toHaveProperty("disabled", true);
    expect(screen.getByTestId("input")).toHaveProperty("disabled", true);
  });

  test("is true when status is streaming", () => {
    (useChat as any).mockReturnValue({ ...defaultChat, status: "streaming" });
    render(<ChatInterface />);
    expect(screen.getByTestId("submit")).toHaveProperty("disabled", true);
    expect(screen.getByTestId("input")).toHaveProperty("disabled", true);
  });

  test("is false when status is error", () => {
    (useChat as any).mockReturnValue({ ...defaultChat, status: "error" });
    render(<ChatInterface />);
    expect(screen.getByTestId("submit")).toHaveProperty("disabled", false);
    expect(screen.getByTestId("input")).toHaveProperty("disabled", false);
  });
});

describe("user interactions", () => {
  test("calls handleInputChange when user types", async () => {
    const user = userEvent.setup();
    render(<ChatInterface />);
    await user.type(screen.getByTestId("input"), "a");
    expect(mockHandleInputChange).toHaveBeenCalled();
  });

  test("calls handleSubmit when submit button is clicked", async () => {
    const user = userEvent.setup();
    render(<ChatInterface />);
    await user.click(screen.getByTestId("submit"));
    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });

  test("does not call handleSubmit when disabled (submitted)", async () => {
    const user = userEvent.setup();
    (useChat as any).mockReturnValue({ ...defaultChat, status: "submitted" });
    render(<ChatInterface />);
    await user.click(screen.getByTestId("submit"));
    expect(mockHandleSubmit).not.toHaveBeenCalled();
  });

  test("does not call handleSubmit when disabled (streaming)", async () => {
    const user = userEvent.setup();
    (useChat as any).mockReturnValue({ ...defaultChat, status: "streaming" });
    render(<ChatInterface />);
    await user.click(screen.getByTestId("submit"));
    expect(mockHandleSubmit).not.toHaveBeenCalled();
  });
});

describe("auto-scroll behavior", () => {
  test("attempts to scroll when messages update", () => {
    const mockScrollTop = vi.fn();
    const mockScrollContainer = {
      scrollTop: 0,
      scrollHeight: 500,
    };
    Object.defineProperty(mockScrollContainer, "scrollTop", {
      set: mockScrollTop,
      get: () => 0,
    });

    const querySelectorSpy = vi
      .spyOn(Element.prototype, "querySelector")
      .mockReturnValue(mockScrollContainer as unknown as Element);

    const { rerender } = render(<ChatInterface />);

    (useChat as any).mockReturnValue({
      ...defaultChat,
      messages: [{ id: "1", role: "user", content: "Hello" }],
    });
    rerender(<ChatInterface />);

    expect(querySelectorSpy).toHaveBeenCalledWith(
      "[data-radix-scroll-area-viewport]"
    );

    querySelectorSpy.mockRestore();
  });

  test("re-renders correctly when messages are added", () => {
    const { rerender } = render(<ChatInterface />);
    expect(screen.getByTestId("message-list").textContent).toContain("0 messages");

    (useChat as any).mockReturnValue({
      ...defaultChat,
      messages: [
        { id: "1", role: "user", content: "Hello" },
        { id: "2", role: "assistant", content: "Hi!" },
      ],
    });
    rerender(<ChatInterface />);

    expect(screen.getByTestId("message-list").textContent).toContain("2 messages");
  });
});
