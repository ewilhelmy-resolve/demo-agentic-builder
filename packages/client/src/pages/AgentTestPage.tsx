/**
 * AgentTestPage - Test agent before publishing
 *
 * Full-screen chat interface for testing agent behavior
 * with the current draft configuration
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Send,
  Loader2,
  Squirrel,
  Bot,
  Headphones,
  ShieldCheck,
  Key,
  BookOpen,
  RotateCcw,
  CheckCircle,
} from "lucide-react";

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
  squirrel: Squirrel,
  bot: Bot,
  headphones: Headphones,
  "shield-check": ShieldCheck,
  key: Key,
  "book-open": BookOpen,
};

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  slate: { bg: "bg-slate-800", text: "text-white" },
  blue: { bg: "bg-blue-600", text: "text-white" },
  emerald: { bg: "bg-emerald-600", text: "text-white" },
  purple: { bg: "bg-purple-600", text: "text-white" },
  orange: { bg: "bg-orange-500", text: "text-white" },
};

interface AgentConfig {
  name: string;
  description: string;
  instructions: string;
  role: string;
  completionCriteria: string;
  iconId: string;
  iconColorId: string;
  agentType: "answer" | "knowledge" | "workflow" | null;
  conversationStarters: string[];
  knowledgeSources: string[];
  actions: string[];
  guardrails: string[];
  interactionStyle: string;
  contextSwitching: boolean;
  ticketCreation: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AgentTestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = location.state?.config as AgentConfig | undefined;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle no config (direct navigation)
  if (!config) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No agent configuration found.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const Icon = ICON_MAP[config.iconId] || Squirrel;
  const color = COLOR_MAP[config.iconColorId] || COLOR_MAP.slate;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate agent response based on configuration
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: generateResponse(input.trim(), config),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleConversationStarter = (starter: string) => {
    setInput(starter);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  const handleBack = () => {
    window.history.back();
  };

  const handlePublish = () => {
    // Navigate back - ideally would trigger publish on return
    // For now, go back to the builder
    window.history.back();
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b bg-white">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className={cn("size-8 rounded-lg flex items-center justify-center", color.bg)}>
            <Icon className={cn("size-4", color.text)} />
          </div>
          <div>
            <span className="font-medium">{config.name}</span>
            <span className="text-xs text-muted-foreground ml-2">Test Mode</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <Button size="sm" onClick={handlePublish} className="gap-2">
            <CheckCircle className="size-4" />
            Looks Good, Publish
          </Button>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <div className={cn("size-16 rounded-xl flex items-center justify-center mx-auto", color.bg)}>
                <Icon className={cn("size-8", color.text)} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{config.name}</h2>
                <p className="text-muted-foreground mt-1">{config.description}</p>
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Test your agent by sending messages below. The agent will respond based on its configuration.
              </p>

              {/* Conversation starters */}
              {config.conversationStarters.filter((s) => s.trim()).length > 0 && (
                <div className="pt-4">
                  <p className="text-xs text-muted-foreground mb-3">Try one of these:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {config.conversationStarters
                      .filter((s) => s.trim())
                      .map((starter, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleConversationStarter(starter)}
                          className="px-4 py-2 text-sm border rounded-full hover:bg-muted transition-colors"
                        >
                          {starter}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className={cn("size-8 rounded-lg flex items-center justify-center flex-shrink-0", color.bg)}>
                  <Icon className={cn("size-4", color.text)} />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[75%] px-4 py-3 rounded-2xl",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className={cn("size-8 rounded-lg flex items-center justify-center flex-shrink-0", color.bg)}>
                <Icon className={cn("size-4", color.text)} />
              </div>
              <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t bg-white px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message to test your agent..."
              className="flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
              <Send className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            This is a test conversation. Responses are simulated based on your agent's configuration.
          </p>
        </div>
      </div>
    </div>
  );
}

// Generate simulated response based on agent configuration
function generateResponse(input: string, config: AgentConfig): string {
  const lowerInput = input.toLowerCase();
  const style = config.interactionStyle.toLowerCase();

  // Check guardrails
  for (const guardrail of config.guardrails) {
    if (guardrail && lowerInput.includes(guardrail.toLowerCase())) {
      return `I'm sorry, but I'm not able to help with questions about ${guardrail}. Is there something else I can assist you with?`;
    }
  }

  // Style-based responses
  let prefix = "";
  let suffix = "";

  if (style.includes("spock")) {
    prefix = "Fascinating. ";
    suffix = " This is the logical conclusion based on available data.";
  } else if (style.includes("shakespeare")) {
    prefix = "Hark! Good friend, ";
    suffix = " Pray tell if thou requirest further assistance.";
  } else if (style.includes("comical")) {
    prefix = "Alright, let me put on my thinking cap! 🎩 ";
    suffix = " Hope that helps! 😄";
  } else if (style.includes("professional")) {
    prefix = "";
    suffix = " Please let me know if you have any additional questions.";
  } else if (style.includes("concise")) {
    // Keep it short
  } else {
    // Conversational and friendly (default)
    prefix = "Great question! ";
    suffix = " Is there anything else you'd like to know?";
  }

  // Generate content based on query type
  let content = "";

  if (lowerInput.includes("help") || lowerInput.includes("what can you do")) {
    content = `I'm ${config.name}. ${config.description || "I'm here to assist you."} I have access to ${config.knowledgeSources.length} knowledge source(s) and can perform ${config.actions.length} action(s).`;
  } else if (lowerInput.includes("weather")) {
    content = "Based on my knowledge sources, I can provide weather-related information. Currently, the forecast shows mild conditions with temperatures around 68°F (20°C).";
  } else if (lowerInput.includes("password") || lowerInput.includes("reset")) {
    if (config.actions.includes("password_reset")) {
      content = "I can help you reset your password. I'll need your email address or username to proceed with the password reset workflow.";
    } else {
      content = "I don't currently have access to password reset functionality. Please contact your IT administrator.";
    }
  } else if (lowerInput.includes("ticket") || lowerInput.includes("support")) {
    if (config.ticketCreation) {
      content = "I can create a support ticket for you. Please describe the issue you're experiencing and I'll file it with the appropriate team.";
    } else {
      content = "I'm not configured to create tickets, but I can try to help answer your question directly.";
    }
  } else {
    content = `Based on my understanding of "${input.slice(0, 50)}${input.length > 50 ? "..." : ""}", here's what I found. ${config.instructions ? `As instructed, I follow these guidelines: "${config.instructions.slice(0, 100)}${config.instructions.length > 100 ? "..." : ""}"` : "I'll do my best to provide helpful information."}`;
  }

  return `${prefix}${content}${suffix}`;
}
