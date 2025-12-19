/**
 * AgentBuilderPage - Chat-based agent creation experience
 *
 * Implements RitaGo Agent Creation flow:
 * - Conversational collection of agent config
 * - Collects: name, description, role/persona, responsibilities, completion criteria
 * - Infers agent type (Answer, Knowledge, Workflow)
 * - Summarizes and confirms before finalizing
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, HelpCircle, Send, Check, Play, Clock, FileText, Workflow, MessageSquare,
  Upload, Link2, Search, X, Sparkles, Plus, Trash2, Squirrel, ChevronDown, Copy,
  // Icon picker icons
  ShieldCheck, TrendingUp, BookOpen, ClipboardList, LineChart, Briefcase, Users,
  Landmark, Truck, Key, Award, Settings, AlertCircle, Rocket, Bot, Headphones,
  GraduationCap, Heart, Zap, Globe, Lock, Mail, Phone, Star, Target, ThumbsUp,
  Wrench, Calendar, Coffee, Database, Folder, Home, Layers, Map, Package, ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { WizardAgentBuilder } from "@/components/agents/WizardAgentBuilder";
import { WizardFloatBuilder } from "@/components/agents/WizardFloatBuilder";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
}

type ConversationStep =
  | "start"
  | "intent"
  | "role"
  | "responsibilities"
  | "completion"
  | "select_type"
  | "confirm_type"
  | "trigger_phrases"
  | "guardrails"
  | "select_sources"
  | "confirm"
  | "knowledge_sources"
  | "done";

interface AgentConfig {
  name: string;
  description: string;
  role: string;
  responsibilities: string;
  completionCriteria: string;
  agentType: "answer" | "knowledge" | "workflow" | null;
  knowledgeSources: string[];
  workflows: string[];
  hasRequiredConnections: boolean;
  // Additional configure fields
  instructions: string;
  conversationStarters: string[];
  guardrails: string[]; // Topics/requests the agent should NOT handle
  // Icon customization
  iconId: string;
  iconColorId: string;
}

const AGENT_TYPE_INFO = {
  answer: {
    label: "Answer agent",
    shortLabel: "Answer Agent",
    shortDesc: "Use your company's knowledge and gives clear, helpful responses.",
    subDesc: "Perfect for HR, IT, and policy Q&A.",
    description: "turning pre-retrieved content (from internal or external sources) into clear, conversational answers",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  knowledge: {
    label: "Knowledge agent",
    shortLabel: "Knowledge Agent",
    shortDesc: "Documents you choose to give strict, policy-accurate answers",
    subDesc: "Great for compliance, legal, HR policy, device manuals.",
    description: "providing answers directly from its pre-configured knowledge without requiring search",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  workflow: {
    label: "Workflow agent",
    shortLabel: "Workflow Agent",
    shortDesc: "Runs automations and performs tasks based on leveraging Resolve actions.",
    subDesc: "Great for password resets, access requests, onboarding tasks.",
    description: "running automations or workflows and explaining the results back to users",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
};

// Mock available knowledge sources in the org (uploads + connections)
const AVAILABLE_KNOWLEDGE_SOURCES = [
  // Uploads
  { id: "hr-policies", name: "HR Policies", description: "Company HR policies and guidelines", type: "upload", tags: ["hr", "policy", "employee"] },
  { id: "benefits-guide", name: "Benefits Guide", description: "Health insurance, 401k, and other benefits", type: "upload", tags: ["hr", "benefits", "insurance", "401k"] },
  { id: "pto-handbook", name: "PTO Handbook", description: "Time off policies and procedures", type: "upload", tags: ["hr", "pto", "vacation", "time off"] },
  { id: "employee-faq", name: "Employee FAQ", description: "Common questions and answers", type: "upload", tags: ["hr", "faq", "employee"] },
  { id: "onboarding-docs", name: "Onboarding Documents", description: "New hire information", type: "upload", tags: ["hr", "onboarding", "new hire"] },
  { id: "it-security-policy", name: "IT Security Policy", description: "Security guidelines and compliance", type: "upload", tags: ["it", "security", "compliance"] },
  { id: "expense-policy", name: "Expense Policy", description: "Travel and expense reimbursement rules", type: "upload", tags: ["finance", "expense", "travel"] },
  { id: "code-of-conduct", name: "Code of Conduct", description: "Employee behavior guidelines", type: "upload", tags: ["hr", "compliance", "conduct"] },
  // Connections
  { id: "confluence-hr", name: "Confluence - HR Space", description: "HR team Confluence workspace", type: "connection", tags: ["hr", "confluence"] },
  { id: "sharepoint-policies", name: "SharePoint - Company Policies", description: "Central policy repository", type: "connection", tags: ["policy", "sharepoint"] },
  { id: "notion-wiki", name: "Notion - Company Wiki", description: "Internal knowledge base", type: "connection", tags: ["wiki", "notion"] },
  { id: "gdrive-hr", name: "Google Drive - HR Folder", description: "HR shared drive", type: "connection", tags: ["hr", "gdrive"] },
];

// Mock available workflows in the org
const AVAILABLE_WORKFLOWS = [
  { id: "password-reset", name: "Password Reset", description: "Reset user passwords in AD" },
  { id: "access-request", name: "Access Request", description: "Request system access" },
  { id: "new-hire-setup", name: "New Hire Setup", description: "Provision accounts for new employees" },
  { id: "offboarding", name: "Offboarding", description: "Revoke access for departing employees" },
];

// Icon picker options
const ICON_COLORS = [
  { id: "slate", bg: "bg-slate-800", text: "text-white", preview: "bg-slate-800" },
  { id: "blue", bg: "bg-blue-600", text: "text-white", preview: "bg-blue-600" },
  { id: "emerald", bg: "bg-emerald-600", text: "text-white", preview: "bg-emerald-600" },
  { id: "purple", bg: "bg-purple-600", text: "text-white", preview: "bg-purple-600" },
  { id: "orange", bg: "bg-orange-500", text: "text-white", preview: "bg-orange-500" },
  { id: "rose", bg: "bg-rose-500", text: "text-white", preview: "bg-rose-500" },
];

const AVAILABLE_ICONS = [
  { id: "bot", icon: Bot, keywords: ["ai", "assistant", "robot"] },
  { id: "message-square", icon: MessageSquare, keywords: ["chat", "conversation"] },
  { id: "headphones", icon: Headphones, keywords: ["support", "help", "audio"] },
  { id: "graduation-cap", icon: GraduationCap, keywords: ["education", "learning", "training"] },
  { id: "shield-check", icon: ShieldCheck, keywords: ["security", "compliance", "protection"] },
  { id: "clipboard-list", icon: ClipboardList, keywords: ["tasks", "checklist", "todo"] },
  { id: "users", icon: Users, keywords: ["team", "people", "hr"] },
  { id: "briefcase", icon: Briefcase, keywords: ["work", "business", "job"] },
  { id: "book-open", icon: BookOpen, keywords: ["knowledge", "documentation", "reading"] },
  { id: "zap", icon: Zap, keywords: ["automation", "fast", "power"] },
  { id: "target", icon: Target, keywords: ["goals", "focus", "aim"] },
  { id: "globe", icon: Globe, keywords: ["web", "international", "world"] },
  { id: "lock", icon: Lock, keywords: ["security", "password", "private"] },
  { id: "mail", icon: Mail, keywords: ["email", "message", "communication"] },
  { id: "phone", icon: Phone, keywords: ["call", "contact", "support"] },
  { id: "calendar", icon: Calendar, keywords: ["schedule", "date", "time"] },
  { id: "database", icon: Database, keywords: ["data", "storage", "info"] },
  { id: "folder", icon: Folder, keywords: ["files", "documents", "organize"] },
  { id: "settings", icon: Settings, keywords: ["config", "preferences", "options"] },
  { id: "wrench", icon: Wrench, keywords: ["tools", "fix", "repair"] },
  { id: "heart", icon: Heart, keywords: ["health", "wellness", "care"] },
  { id: "star", icon: Star, keywords: ["favorite", "rating", "important"] },
  { id: "award", icon: Award, keywords: ["achievement", "recognition", "badge"] },
  { id: "rocket", icon: Rocket, keywords: ["launch", "startup", "fast"] },
  { id: "coffee", icon: Coffee, keywords: ["break", "cafe", "drink"] },
  { id: "home", icon: Home, keywords: ["house", "main", "dashboard"] },
  { id: "key", icon: Key, keywords: ["access", "password", "unlock"] },
  { id: "layers", icon: Layers, keywords: ["stack", "design", "levels"] },
  { id: "map", icon: Map, keywords: ["location", "navigation", "directions"] },
  { id: "package", icon: Package, keywords: ["shipping", "delivery", "box"] },
  { id: "shopping-cart", icon: ShoppingCart, keywords: ["ecommerce", "buy", "cart"] },
  { id: "thumbs-up", icon: ThumbsUp, keywords: ["like", "approve", "good"] },
  { id: "trending-up", icon: TrendingUp, keywords: ["growth", "analytics", "increase"] },
  { id: "line-chart", icon: LineChart, keywords: ["analytics", "data", "metrics"] },
  { id: "landmark", icon: Landmark, keywords: ["bank", "finance", "government"] },
  { id: "truck", icon: Truck, keywords: ["delivery", "shipping", "logistics"] },
  { id: "squirrel", icon: Squirrel, keywords: ["animal", "nature", "cute"] },
];

// Mock saved agents data (for loading existing agents)
const MOCK_SAVED_AGENTS: Record<string, AgentConfig> = {
  "1": {
    name: "HelpDesk Advisor",
    description: "Answers IT support questions and helps employees troubleshoot common technical issues.",
    role: "A friendly and knowledgeable IT support specialist",
    responsibilities: "Answering questions about password resets, VPN setup, software installation, and common IT issues. Providing step-by-step troubleshooting guidance.",
    completionCriteria: "When the user's technical issue is resolved, or when it needs to escalate to the IT team for hands-on support.",
    agentType: "answer",
    knowledgeSources: ["IT Security Policy", "Employee FAQ"],
    workflows: [],
    hasRequiredConnections: true,
    instructions: "You are a helpful IT support specialist.\n\nYour responsibilities include:\n- Answering questions about password resets, VPN, and software\n- Providing step-by-step troubleshooting guidance\n- Escalating complex issues to the IT team\n\nAlways be patient and explain technical concepts in simple terms.",
    conversationStarters: [
      "I forgot my password",
      "How do I connect to VPN?",
      "I need software installed",
      "My computer is running slow",
    ],
    guardrails: ["payroll questions", "HR policy questions"],
    iconId: "headphones",
    iconColorId: "blue",
  },
  "2": {
    name: "Onboarding Compliance Checker",
    description: "Answers from compliance docs and ensures new hires complete required training.",
    role: "A compliance-focused onboarding assistant",
    responsibilities: "Guiding new employees through required compliance training, answering questions about company policies, and tracking completion status.",
    completionCriteria: "When the employee confirms understanding of all required compliance items.",
    agentType: "knowledge",
    knowledgeSources: ["HR Policies", "Code of Conduct", "IT Security Policy", "Employee FAQ"],
    workflows: [],
    hasRequiredConnections: true,
    instructions: "You are a compliance onboarding assistant.\n\nYou ONLY answer from the connected compliance documents.\n\nDo not make up information - if something isn't in the documents, say so.",
    conversationStarters: [
      "What compliance training do I need?",
      "Tell me about the code of conduct",
      "What are the security policies?",
      "How do I report compliance issues?",
    ],
    guardrails: ["IT troubleshooting", "benefits questions", "payroll"],
    iconId: "shield-check",
    iconColorId: "emerald",
  },
  "3": {
    name: "Password Reset Bot",
    description: "Automates password resets for employees.",
    role: "An automated password reset assistant",
    responsibilities: "Verifying user identity and executing password resets through the AD workflow.",
    completionCriteria: "When the password reset is complete and the user confirms they can log in.",
    agentType: "workflow",
    knowledgeSources: [],
    workflows: ["Password Reset"],
    hasRequiredConnections: true,
    instructions: "You help employees reset their passwords.\n\nAlways verify the user's identity before initiating a reset.\n\nExplain each step of the process clearly.",
    conversationStarters: [
      "I need to reset my password",
      "I'm locked out of my account",
      "Can you help me change my password?",
      "My password expired",
    ],
    guardrails: ["other IT issues", "software installation", "VPN setup"],
    iconId: "key",
    iconColorId: "purple",
  },
};

export default function AgentBuilderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: agentId } = useParams<{ id: string }>();
  const agentName = location.state?.agentName || "Untitled Agent";
  const duplicatedConfig = location.state?.duplicatedConfig as AgentConfig | undefined;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if we're editing an existing agent
  const isEditing = !!agentId;
  const savedAgent = agentId ? MOCK_SAVED_AGENTS[agentId] : null;
  const isDuplicate = !!duplicatedConfig;

  const [activeTab, setActiveTab] = useState<"create" | "configure">(isEditing || isDuplicate ? "configure" : "create");
  const [showTestModal, setShowTestModal] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [step, setStep] = useState<ConversationStep>(isEditing || isDuplicate ? "done" : "start");
  const [isTyping, setIsTyping] = useState(false);
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<AgentConfig>(duplicatedConfig || savedAgent || {
    name: agentName,
    description: "",
    role: "",
    responsibilities: "",
    completionCriteria: "",
    agentType: null,
    knowledgeSources: [],
    workflows: [],
    hasRequiredConnections: false,
    instructions: "",
    conversationStarters: ["", "", "", ""],
    guardrails: [],
    iconId: "bot",
    iconColorId: "slate",
  });

  // Legacy button states (for old flow)
  const [showConfirmButtons, setShowConfirmButtons] = useState(false);
  const [showKnowledgeButtons, setShowKnowledgeButtons] = useState(false);
  const [showWorkflowButtons, setShowWorkflowButtons] = useState(false);

  // Selection UI states (new flow)
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [selectedType, setSelectedType] = useState<"answer" | "knowledge" | "workflow" | null>(null);
  const [suggestedType, setSuggestedType] = useState<"answer" | "knowledge" | "workflow">("answer");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [sourceSearchQuery, setSourceSearchQuery] = useState("");
  const [suggestedSourceIds, setSuggestedSourceIds] = useState<string[]>([]);
  const [showTypeConfirmation, setShowTypeConfirmation] = useState(false);
  const [showTriggerPhrases, setShowTriggerPhrases] = useState(false);
  const [suggestedTriggerPhrases, setSuggestedTriggerPhrases] = useState<string[]>([]);
  const [showGuardrails, setShowGuardrails] = useState(false);
  const [guardrailInput, setGuardrailInput] = useState("");

  // Test tab state
  const [testMessages, setTestMessages] = useState<Message[]>([]);
  const [testInput, setTestInput] = useState("");
  const [isTestTyping, setIsTestTyping] = useState(false);
  const testMessagesEndRef = useRef<HTMLDivElement>(null);

  // Change agent type modal state
  const [showChangeTypeModal, setShowChangeTypeModal] = useState(false);
  const [showConfirmTypeChangeModal, setShowConfirmTypeChangeModal] = useState(false);
  const [pendingAgentType, setPendingAgentType] = useState<"answer" | "knowledge" | "workflow" | null>(null);

  // Icon picker state
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearchQuery, setIconSearchQuery] = useState("");

  // Publish modal state
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Builder mode toggle (for demo purposes)
  const [builderMode, setBuilderMode] = useState<"chat" | "wizard" | "wizard-float">("chat");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hi! I can help you build a new agent.\nFirst, what kind of agent are you building today?`,
    },
  ]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, showConfirmButtons, showTypeSelector, showSourceSelector, showTypeConfirmation, showTriggerPhrases, showGuardrails]);

  // Auto-scroll test messages
  useEffect(() => {
    testMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [testMessages, isTestTyping]);

  // Initialize test chat when opening test modal
  useEffect(() => {
    if (showTestModal && testMessages.length === 0 && step === "done") {
      setTestMessages([
        {
          id: "test-welcome",
          role: "assistant",
          content: `Hi! I'm ${config.name}. ${config.description}\n\nHow can I help you today?`,
        },
      ]);
    }
  }, [showTestModal, testMessages.length, step, config.name, config.description]);

  // Handle test message submission
  const handleTestSendMessage = () => {
    if (!testInput.trim() || isTestTyping) return;

    const userMessage: Message = {
      id: `test-user-${Date.now()}`,
      role: "user",
      content: testInput.trim(),
    };
    setTestMessages((prev) => [...prev, userMessage]);
    const input = testInput.trim();
    setTestInput("");

    // Simulate agent response
    setIsTestTyping(true);
    setTimeout(() => {
      // Generate a simulated response based on the agent config
      const response = generateTestResponse(input);
      setTestMessages((prev) => [
        ...prev,
        {
          id: `test-assistant-${Date.now()}`,
          role: "assistant",
          content: response,
        },
      ]);
      setIsTestTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  // Generate simulated test response based on agent config
  const generateTestResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    // Check guardrails first
    for (const guardrail of config.guardrails) {
      if (guardrail && input.includes(guardrail.toLowerCase())) {
        return `I'm sorry, but I'm not able to help with ${guardrail}. Please contact the appropriate team for assistance with that topic.`;
      }
    }

    // Generate contextual response based on agent type and config
    if (config.agentType === "workflow") {
      const workflowName = config.workflows[0] || "the workflow";
      return `I can help you with that! Let me initiate the ${workflowName} process.\n\n[Simulated: Workflow would execute here]\n\nIs there anything else you'd like me to help with?`;
    }

    if (config.agentType === "knowledge") {
      return `Based on the documentation I have access to:\n\n[Simulated response from: ${config.knowledgeSources.join(", ") || "configured knowledge sources"}]\n\nThis is a simulated response. In production, I would provide accurate answers from the connected documents.`;
    }

    // Default answer agent response
    return `Thanks for your question about "${userInput}"\n\nAs ${config.role || "your assistant"}, I'm here to help with ${config.responsibilities || "your questions"}.\n\n[This is a simulated test response. In production, the agent would provide real answers based on the configured knowledge sources and instructions.]`;
  };

  const handleTestKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTestSendMessage();
    }
  };

  // Handle clicking a conversation starter in test mode
  const handleTestStarterClick = (starter: string) => {
    setTestInput(starter);
  };

  const inferAgentType = (
    config: AgentConfig
  ): "answer" | "knowledge" | "workflow" => {
    const text =
      `${config.role} ${config.responsibilities} ${config.completionCriteria}`.toLowerCase();

    // Workflow indicators
    const workflowKeywords = [
      "automate",
      "run",
      "execute",
      "trigger",
      "action",
      "task",
      "process",
      "workflow",
      "reset password",
      "create ticket",
      "submit",
      "update system",
    ];
    if (workflowKeywords.some((kw) => text.includes(kw))) {
      return "workflow";
    }

    // Knowledge indicators
    const knowledgeKeywords = [
      "document",
      "specific",
      "policy",
      "compliance",
      "handbook",
      "manual",
      "only from",
      "based on",
      "according to",
      "strictly",
    ];
    if (knowledgeKeywords.some((kw) => text.includes(kw))) {
      return "knowledge";
    }

    // Default to answer agent
    return "answer";
  };

  // Generate trigger phrase suggestions based on agent config
  const generateTriggerPhrases = (agentConfig: AgentConfig): string[] => {
    const desc = agentConfig.description.toLowerCase();
    const role = agentConfig.role.toLowerCase();
    const responsibilities = agentConfig.responsibilities.toLowerCase();

    // Onboarding-related agent
    if (desc.includes("onboarding") || role.includes("onboarding") || responsibilities.includes("onboarding") || responsibilities.includes("new employee")) {
      return [
        "I'm a new employee and need help getting started",
        "Can you help me with my first day orientation?",
        "I need to set up my accounts and access",
        "What do I need to do for onboarding?",
        "Help me understand the company processes",
        "I'm new here, what are my next steps?",
        "Can you guide me through employee orientation?",
        "I need help with new hire paperwork",
        "What tools and systems do I need access to?",
        "Can you explain the onboarding workflow?",
      ];
    }

    // HR/Benefits-related agent
    if (desc.includes("hr") || desc.includes("benefits") || role.includes("hr") || responsibilities.includes("pto") || responsibilities.includes("benefits")) {
      return [
        "How do I request time off?",
        "What are my health insurance options?",
        "How do I enroll in benefits?",
        "What's the PTO policy?",
        "How do I update my personal information?",
        "Who do I contact about payroll issues?",
        "What holidays does the company observe?",
        "How do I access my pay stubs?",
      ];
    }

    // IT/Technical support agent
    if (desc.includes("it") || desc.includes("technical") || role.includes("it") || responsibilities.includes("password") || responsibilities.includes("access")) {
      return [
        "I forgot my password",
        "How do I reset my password?",
        "I need access to a system",
        "My computer isn't working",
        "How do I connect to VPN?",
        "I need software installed",
        "Who do I contact for IT help?",
        "How do I set up my email?",
      ];
    }

    // Default generic phrases
    return [
      "How can you help me?",
      "What can you do?",
      "I have a question",
      "I need assistance",
      "Can you help me with something?",
      "Where do I find information about...",
    ];
  };

  // Generate Overall Understanding summary based on config and type
  const generateOverallUnderstanding = (agentConfig: AgentConfig, agentType: "answer" | "knowledge" | "workflow"): string => {
    const role = agentConfig.role || "assistant";
    const responsibilities = agentConfig.responsibilities || "helping users";
    const completion = agentConfig.completionCriteria || "when the task is complete";

    if (agentType === "answer") {
      return `This is an answer formatting agent that acts as ${role}. It will take pre-retrieved content and transform it into clear, conversational responses while ${responsibilities}. The agent considers its job complete when ${completion}.`;
    } else if (agentType === "knowledge") {
      return `This is an embedded knowledge agent that acts as ${role}. It will provide answers directly from its pre-configured knowledge base, ${responsibilities}. The agent considers its job complete when ${completion}.`;
    } else {
      return `This is a workflow execution agent that acts as ${role}. It will run automations and workflows while ${responsibilities}, then explain the results clearly. The agent considers its job complete when ${completion}.`;
    }
  };

  // Suggest relevant knowledge sources based on agent config
  const suggestRelevantSources = (agentConfig: AgentConfig): string[] => {
    const text = `${agentConfig.description} ${agentConfig.role} ${agentConfig.responsibilities}`.toLowerCase();

    // Score each source based on tag matches
    const scored = AVAILABLE_KNOWLEDGE_SOURCES.map((source) => {
      let score = 0;
      source.tags.forEach((tag) => {
        if (text.includes(tag)) score += 2;
      });
      // Also check name/description
      if (text.includes(source.name.toLowerCase())) score += 3;
      source.description.toLowerCase().split(" ").forEach((word) => {
        if (word.length > 3 && text.includes(word)) score += 1;
      });
      return { id: source.id, score };
    });

    // Return top matches (score > 0), sorted by score
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => s.id);
  };

  const addAssistantMessage = (content: string, options?: { showButtons?: boolean }) => {
    setIsTyping(true);
    setShowConfirmButtons(false);

    setTimeout(() => {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content,
      };
      setMessages((prev) => [...prev, newMessage]);
      setIsTyping(false);
      if (options?.showButtons) {
        setShowConfirmButtons(true);
      }
    }, 800);
  };

  const processUserInput = (input: string) => {
    switch (step) {
      case "start":
      case "intent":
        setConfig((prev) => ({
          ...prev,
          description: input,
        }));
        setStep("role");
        addAssistantMessage(
          `Got it. Let's define who this agent is.\n\n**How would you describe the role or persona of this agent?**\nFor example: "a friendly HR advisor" or "an on-call IT specialist."`
        );
        break;

      case "role":
        setConfig((prev) => ({ ...prev, role: input }));
        setStep("responsibilities");
        addAssistantMessage(
          `Nice. Now let's get specific.\n\n**What should this agent help with day to day?**\nYou can list the types of questions or situations it should handle.`
        );
        break;

      case "responsibilities":
        setConfig((prev) => ({ ...prev, responsibilities: input }));
        setStep("completion");
        addAssistantMessage(
          `Almost there.\n\n**When should this agent consider its job complete?**\nFor example, when the question is answered, when next steps are provided, or when it needs to hand off to a human.`
        );
        break;

      case "completion":
        const updatedConfig = { ...config, completionCriteria: input };
        const inferredType = inferAgentType(updatedConfig);
        setConfig(updatedConfig);
        setSuggestedType(inferredType);
        setSelectedType(inferredType);
        setStep("select_type");

        setIsTyping(true);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: `Based on what you shared, I'd suggest an **${AGENT_TYPE_INFO[inferredType].label}** for this use case.\n\nPlease select the agent type that best fits your needs:`,
            },
          ]);
          setIsTyping(false);
          setShowTypeSelector(true);
        }, 800);
        break;

      case "done":
        addAssistantMessage(
          "The agent configuration is complete. Switch to the Configure tab to review or make changes, or click Publish when you're ready."
        );
        break;
    }
  };

  // Demo flow data
  const demoResponses = [
    "An HR agent that helps employees understand benefits and PTO.",
    "A friendly HR benefits advisor.",
    "Answering questions about health insurance, PTO, enrollment, and where to find HR policies.",
    "When the employee gets their answer, or when it needs to direct them to HR.",
  ];

  const runDemo = async () => {
    if (isRunningDemo) return;
    setIsRunningDemo(true);

    // Reset state
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: `Hi! I can help you build a new agent.\nFirst, what kind of agent are you building today?`,
      },
    ]);
    setStep("start");
    setConfig({
      name: agentName,
      description: "",
      role: "",
      responsibilities: "",
      completionCriteria: "",
      agentType: null,
      knowledgeSources: [],
      workflows: [],
      hasRequiredConnections: false,
      instructions: "",
      conversationStarters: ["", "", "", ""],
      guardrails: [],
      iconId: "bot",
      iconColorId: "slate",
    });
    setShowConfirmButtons(false);
    setShowKnowledgeButtons(false);
    setShowWorkflowButtons(false);
    setShowTypeSelector(false);
    setShowSourceSelector(false);
    setShowTypeConfirmation(false);
    setShowTriggerPhrases(false);
    setSuggestedTriggerPhrases([]);
    setShowGuardrails(false);
    setGuardrailInput("");
    setSelectedType(null);
    setSuggestedType("answer");
    setSelectedSources([]);
    setSelectedWorkflows([]);

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Step 1: Intent
    await delay(1000);
    const msg1: Message = { id: Date.now().toString(), role: "user", content: demoResponses[0] };
    setMessages((prev) => [...prev, msg1]);
    setConfig((prev) => ({ ...prev, description: demoResponses[0] }));
    setStep("role");
    setIsTyping(true);
    setStatusMessage("Analyzing your requirements...");
    await delay(1500);
    setIsTyping(false);
    setStatusMessage(null);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `Got it. Let's define who this agent is.\n\n**How would you describe the role or persona of this agent?**\nFor example: "a friendly HR advisor" or "an on-call IT specialist."`,
      },
    ]);

    // Step 2: Role
    await delay(1500);
    const msg2: Message = { id: Date.now().toString(), role: "user", content: demoResponses[1] };
    setMessages((prev) => [...prev, msg2]);
    setConfig((prev) => ({ ...prev, role: demoResponses[1] }));
    setStep("responsibilities");
    setIsTyping(true);
    setStatusMessage("Defining agent persona...");
    await delay(1200);
    setIsTyping(false);
    setStatusMessage(null);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `Nice. Now let's get specific.\n\n**What should this agent help with day to day?**\nYou can list the types of questions or situations it should handle.`,
      },
    ]);

    // Step 3: Responsibilities
    await delay(1500);
    const msg3: Message = { id: Date.now().toString(), role: "user", content: demoResponses[2] };
    setMessages((prev) => [...prev, msg3]);
    setConfig((prev) => ({ ...prev, responsibilities: demoResponses[2] }));
    setStep("completion");
    setIsTyping(true);
    setStatusMessage("Configuring responsibilities...");
    await delay(1000);
    setIsTyping(false);
    setStatusMessage(null);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `Almost there.\n\n**When should this agent consider its job complete?**\nFor example, when the question is answered, when next steps are provided, or when it needs to hand off to a human.`,
      },
    ]);

    // Step 4: Completion - show type selector and stop demo for user interaction
    await delay(1500);
    const msg4: Message = { id: Date.now().toString(), role: "user", content: demoResponses[3] };
    setMessages((prev) => [...prev, msg4]);
    setConfig((prev) => ({
      ...prev,
      completionCriteria: demoResponses[3],
    }));
    setStep("select_type");
    setIsTyping(true);
    setStatusMessage("Determining best agent type...");
    await delay(2000);
    setIsTyping(false);
    setStatusMessage(null);
    setSuggestedType("answer");
    setSelectedType("answer");
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `Based on what you shared, I'd suggest an **Answer Agent** for this use case.\n\nPlease select the agent type that best fits your needs:`,
      },
    ]);
    setShowTypeSelector(true);
    setIsRunningDemo(false);
  };

  const handleConfirm = () => {
    setShowConfirmButtons(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "Yes, continue",
    };
    setMessages((prev) => [...prev, userMessage]);

    // Move to type-specific requirements step
    setStep("knowledge_sources");

    if (config.agentType === "answer") {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Great! To help this agent answer questions effectively, would you like to connect any knowledge sources?\n\nThis could include HR docs, policy guides, FAQs, or other reference materials.`,
          },
        ]);
        setIsTyping(false);
        setShowKnowledgeButtons(true);
      }, 800);
    } else if (config.agentType === "knowledge") {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Since this is a **Knowledge Agent**, it will only answer from specific documents — no guessing or inference.\n\n**Which documents should this agent use?**\nThis is required for Knowledge Agents to ensure accuracy and compliance.`,
          },
        ]);
        setIsTyping(false);
        setShowKnowledgeButtons(true);
      }, 800);
    } else if (config.agentType === "workflow") {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Since this is a **Workflow Agent**, it needs to connect to workflows to perform actions.\n\n**Which workflows should this agent have access to?**\nThis is required for Workflow Agents to execute tasks.`,
          },
        ]);
        setIsTyping(false);
        setShowWorkflowButtons(true);
      }, 800);
    }
  };

  const handleAddKnowledgeSources = () => {
    setShowKnowledgeButtons(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "Add knowledge sources",
    };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate adding knowledge sources
    setConfig((prev) => ({
      ...prev,
      knowledgeSources: ["HR Policies", "Benefits Guide", "PTO Handbook"],
      hasRequiredConnections: true,
    }));

    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `I've connected the following knowledge sources:\n• HR Policies\n• Benefits Guide\n• PTO Handbook\n\nYour agent is now configured and ready. You can review the settings in the Configure tab or click Publish when ready.`,
        },
      ]);
      setIsTyping(false);
      setStep("done");
    }, 1000);
  };

  const handleSkipKnowledgeSources = () => {
    setShowKnowledgeButtons(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "Skip for now",
    };
    setMessages((prev) => [...prev, userMessage]);

    // For Answer Agents, skipping is allowed
    if (config.agentType === "answer") {
      setConfig((prev) => ({ ...prev, hasRequiredConnections: true }));
      addAssistantMessage(
        "No problem! You can add knowledge sources later in the Configure tab.\n\nYour agent is ready. Click Publish when you're done."
      );
      setStep("done");
    } else {
      // For Knowledge Agents, this is required
      addAssistantMessage(
        "Knowledge sources are required for Knowledge Agents. Please select at least one document to continue."
      );
      setShowKnowledgeButtons(true);
    }
  };

  const handleAddWorkflows = () => {
    setShowWorkflowButtons(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "Connect workflows",
    };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate adding workflows
    setConfig((prev) => ({
      ...prev,
      workflows: ["Password Reset", "Access Request"],
      hasRequiredConnections: true,
    }));

    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `I've connected the following workflows:\n• Password Reset\n• Access Request\n\nYour agent is now configured and ready. You can review the settings in the Configure tab or click Publish when ready.`,
        },
      ]);
      setIsTyping(false);
      setStep("done");
    }, 1000);
  };

  // Handler for type selection confirmation (new flow)
  const handleTypeSelectionConfirm = () => {
    if (!selectedType) return;

    setShowTypeSelector(false);
    setConfig((prev) => ({ ...prev, agentType: selectedType }));

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Selected: ${AGENT_TYPE_INFO[selectedType].label}`,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Move to confirmation step with Overall Understanding
    setStep("confirm_type");
    setIsTyping(true);
    setStatusMessage("Generating agent understanding...");

    setTimeout(() => {
      setIsTyping(false);
      setStatusMessage(null);

      const understanding = generateOverallUnderstanding(config, selectedType);
      const typeLabel = AGENT_TYPE_INFO[selectedType].label;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Got it! You're building a **${typeLabel}**.\n\n**Agent Overall Understanding:** ${understanding}\n\nIs this accurate? Please confirm if this correctly captures your agent, or let me know what needs to be adjusted.`,
        },
      ]);
      setShowTypeConfirmation(true);
    }, 1000);
  };

  // Handler for confirming the agent type understanding
  const handleTypeConfirmationConfirm = () => {
    setShowTypeConfirmation(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "Yes, that's correct",
    };
    setMessages((prev) => [...prev, userMessage]);

    // Move to trigger phrases step
    setStep("trigger_phrases");
    setIsTyping(true);
    setStatusMessage("Generating example phrases...");

    // Generate trigger phrases based on config
    const phrases = generateTriggerPhrases(config);
    setSuggestedTriggerPhrases(phrases);

    setTimeout(() => {
      setIsTyping(false);
      setStatusMessage(null);

      const typeLabel = selectedType ? AGENT_TYPE_INFO[selectedType].shortLabel : "agent";
      const phrasesList = phrases.map((p, i) => `${i + 1}. "${p}"`).join("\n");

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `**Example phrases users might say:**\n\n${phrasesList}\n\nThese examples cover different ways users might request your ${typeLabel.toLowerCase()}.\n\nDo these examples capture how users would request your agent? You can add, remove, or modify these in the Configure tab.`,
        },
      ]);
      setShowTriggerPhrases(true);
    }, 1000);
  };

  // Handler for continuing after trigger phrases
  const handleTriggerPhrasesConfirm = () => {
    setShowTriggerPhrases(false);

    // Save the suggested phrases to config as conversation starters
    setConfig((prev) => ({
      ...prev,
      conversationStarters: suggestedTriggerPhrases.slice(0, 4), // Take first 4 as starters
    }));

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "Looks good, continue",
    };
    setMessages((prev) => [...prev, userMessage]);

    // Move to guardrails step
    setStep("guardrails");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      const agentContext = config.description.toLowerCase().includes("onboarding")
        ? "onboarding"
        : config.role.toLowerCase().includes("hr")
        ? "HR"
        : "this";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Now I need to understand the boundaries of your ${agentContext} agent.\n\n**What types of requests should this agent NOT handle?** For example:\n\n• Should it avoid HR policy questions?\n• Should it not handle IT troubleshooting?\n• Are there specific topics outside of ${agentContext} it should redirect?\n\nPlease tell me what types of requests should be excluded, or say 'none' if it should handle all ${agentContext}-related requests.`,
        },
      ]);
      setShowGuardrails(true);
      setGuardrailInput("");
    }, 800);
  };

  // Handler for guardrails input submission
  const handleGuardrailsSubmit = () => {
    setShowGuardrails(false);

    const input = guardrailInput.trim();
    const isNone = input.toLowerCase() === "none" || input === "";

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: isNone ? "None - handle all related requests" : input,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Parse guardrails from input (split by commas, newlines, or bullet points)
    const guardrails = isNone
      ? []
      : input.split(/[,\n•]/).map(s => s.trim()).filter(s => s.length > 0);

    setConfig((prev) => ({
      ...prev,
      guardrails,
    }));

    // Move to source/workflow selection based on type
    setStep("select_sources");
    setIsTyping(true);
    setStatusMessage("Loading available resources...");

    // Calculate suggested sources based on agent config
    const suggested = suggestRelevantSources(config);
    setSuggestedSourceIds(suggested);
    // Pre-select suggested sources
    setSelectedSources(suggested);
    setSourceSearchQuery("");

    setTimeout(() => {
      setIsTyping(false);
      setStatusMessage(null);

      const hasSuggestions = suggested.length > 0;

      if (selectedType === "answer") {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: hasSuggestions
              ? `To help this agent answer questions effectively, I've pre-selected some relevant knowledge sources based on what you described.\n\nReview and adjust the selection, or search for more:`
              : `To help this agent answer questions effectively, you can connect knowledge sources.\n\nSelect the sources this agent should use (or skip if not needed):`,
          },
        ]);
      } else if (selectedType === "knowledge") {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: hasSuggestions
              ? `Since this is an **Embedded Knowledge Agent**, it will only answer from specific documents.\n\nI've pre-selected some relevant sources. Review and adjust (at least one required):`
              : `Since this is an **Embedded Knowledge Agent**, it will only answer from specific documents — no guessing.\n\n**Select the documents this agent must use** (at least one required):`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Since this is a **Workflow Executor**, it needs workflows to perform actions.\n\n**Select the workflows this agent can execute** (at least one required):`,
          },
        ]);
      }
      setShowSourceSelector(true);
    }, 800);
  };

  // Handler for skipping guardrails
  const handleGuardrailsSkip = () => {
    setGuardrailInput("none");
    handleGuardrailsSubmit();
  };

  // Handler for adjusting the agent type (goes back to selection)
  const handleTypeConfirmationAdjust = () => {
    setShowTypeConfirmation(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "I'd like to adjust this",
    };
    setMessages((prev) => [...prev, userMessage]);

    // Go back to type selection
    setStep("select_type");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `No problem! Let's pick a different agent type, or tell me more about what you need:`,
        },
      ]);
      setShowTypeSelector(true);
    }, 600);
  };

  // Handler for source/workflow selection confirmation
  const handleSourceSelectionConfirm = () => {
    const isWorkflowAgent = selectedType === "workflow";
    const isKnowledgeAgent = selectedType === "knowledge";
    const selected = isWorkflowAgent ? selectedWorkflows : selectedSources;

    // Validate required selections
    if ((isWorkflowAgent || isKnowledgeAgent) && selected.length === 0) {
      // Show error - selection required
      return;
    }

    setShowSourceSelector(false);

    const selectedNames = isWorkflowAgent
      ? selectedWorkflows.map((id) => AVAILABLE_WORKFLOWS.find((w) => w.id === id)?.name).filter(Boolean)
      : selectedSources.map((id) => AVAILABLE_KNOWLEDGE_SOURCES.find((s) => s.id === id)?.name).filter(Boolean);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: selected.length > 0
        ? `Selected: ${selectedNames.join(", ")}`
        : "Skip for now",
    };
    setMessages((prev) => [...prev, userMessage]);

    // Update config
    if (isWorkflowAgent) {
      setConfig((prev) => ({
        ...prev,
        workflows: selectedNames as string[],
        hasRequiredConnections: true,
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        knowledgeSources: selectedNames as string[],
        hasRequiredConnections: true,
      }));
    }

    setIsTyping(true);
    setStatusMessage("Finalizing configuration...");

    setTimeout(() => {
      setIsTyping(false);
      setStatusMessage(null);

      const resourceType = isWorkflowAgent ? "workflows" : "knowledge sources";
      const resourceList = selectedNames.length > 0
        ? `\n${selectedNames.map((n) => `• ${n}`).join("\n")}`
        : "";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: selected.length > 0
            ? `I've connected the following ${resourceType}:${resourceList}\n\nYour agent is now configured and ready. You can review the settings in the Configure tab or click Publish when ready.`
            : `No problem! You can add ${resourceType} later in the Configure tab.\n\nYour agent is ready. Click Publish when you're done.`,
        },
      ]);
      setStep("done");
    }, 1000);
  };

  // Toggle source selection
  const toggleSourceSelection = (id: string) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleChangeType = () => {
    setShowConfirmButtons(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "Change agent type",
    };
    setMessages((prev) => [...prev, userMessage]);

    // Cycle through types
    const types: Array<"answer" | "knowledge" | "workflow"> = ["answer", "knowledge", "workflow"];
    const currentIndex = types.indexOf(config.agentType || "answer");
    const nextType = types[(currentIndex + 1) % types.length];

    setConfig((prev) => ({ ...prev, agentType: nextType }));

    const typeInfo = AGENT_TYPE_INFO[nextType];
    addAssistantMessage(
      `How about this instead:\n\n**${typeInfo.label}**\n\nIt will focus on ${typeInfo.description}.\nDoes that sound right?`,
      { showButtons: true }
    );
  };

  const handleBack = () => {
    navigate("/agents");
  };

  const handlePublish = () => {
    // Show publish confirmation modal
    setShowPublishModal(true);
  };

  const handleConfirmPublish = () => {
    console.log("Publishing agent:", config);
    setShowPublishModal(false);

    // Show success toast
    toast.success("Agent published successfully", {
      description: `${config.name} is now available for users.`
    });

    // Navigate back to agents list with published agent data
    navigate("/agents", {
      state: {
        publishedAgent: {
          id: isEditing ? agentId : Date.now().toString(),
          name: config.name,
          description: config.description,
          agentType: config.agentType,
          iconId: config.iconId,
          iconColorId: config.iconColorId,
        }
      }
    });
  };

  const handleDuplicate = () => {
    // Navigate to create page with duplicated config
    navigate("/agents/create", {
      state: {
        agentName: `${config.name} (Copy)`,
        duplicatedConfig: {
          ...config,
          name: `${config.name} (Copy)`,
        },
      },
    });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || isTyping || showConfirmButtons) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const input = inputValue.trim();
    setInputValue("");

    processUserInput(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessageContent = (content: string) => {
    // Simple markdown-like bold parsing
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Mode switcher component
  const ModeSwitcher = () => (
    <div className="fixed bottom-4 left-4 z-50 flex gap-2">
      <Button
        variant={builderMode === "chat" ? "default" : "outline"}
        size="sm"
        onClick={() => setBuilderMode("chat")}
        className={cn("gap-2", builderMode !== "chat" && "bg-white shadow-lg")}
      >
        <MessageSquare className="size-4" />
        Chat
      </Button>
      <Button
        variant={builderMode === "wizard" ? "default" : "outline"}
        size="sm"
        onClick={() => setBuilderMode("wizard")}
        className={cn("gap-2", builderMode !== "wizard" && "bg-white shadow-lg")}
      >
        <FileText className="size-4" />
        Wizard
      </Button>
      <Button
        variant={builderMode === "wizard-float" ? "default" : "outline"}
        size="sm"
        onClick={() => setBuilderMode("wizard-float")}
        className={cn("gap-2", builderMode !== "wizard-float" && "bg-white shadow-lg")}
      >
        <Sparkles className="size-4" />
        Wizard + AI
      </Button>
    </div>
  );

  // If wizard mode is selected, render the WizardAgentBuilder
  if (builderMode === "wizard") {
    return (
      <>
        <ModeSwitcher />
        <WizardAgentBuilder
          initialConfig={{
            name: config.name,
            description: config.description,
            role: config.role,
            completionCriteria: config.completionCriteria,
            iconId: config.iconId,
            iconColorId: config.iconColorId,
            agentType: config.agentType,
          }}
          onBack={handleBack}
          onPublish={(wizardConfig) => {
            setConfig((prev) => ({
              ...prev,
              name: wizardConfig.name,
              description: wizardConfig.description,
              role: wizardConfig.role,
              completionCriteria: wizardConfig.completionCriteria,
              iconId: wizardConfig.iconId,
              iconColorId: wizardConfig.iconColorId,
              agentType: wizardConfig.agentType,
            }));
            setShowPublishModal(true);
          }}
          isEditing={isEditing}
        />
      </>
    );
  }

  // If wizard-float mode is selected, render the WizardFloatBuilder
  if (builderMode === "wizard-float") {
    return (
      <>
        <ModeSwitcher />
        <WizardFloatBuilder
          initialConfig={{
            name: config.name,
            description: config.description,
            role: config.role,
            completionCriteria: config.completionCriteria,
            iconId: config.iconId,
            iconColorId: config.iconColorId,
            agentType: config.agentType,
          }}
          onBack={handleBack}
          onPublish={(wizardConfig) => {
            setConfig((prev) => ({
              ...prev,
              name: wizardConfig.name,
              description: wizardConfig.description,
              role: wizardConfig.role,
              completionCriteria: wizardConfig.completionCriteria,
              iconId: wizardConfig.iconId,
              iconColorId: wizardConfig.iconColorId,
              agentType: wizardConfig.agentType,
            }));
            setShowPublishModal(true);
          }}
          isEditing={isEditing}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-muted/50">
      <ModeSwitcher />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Go back to agents"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-lg font-medium">{config.name}</h1>
          <Badge variant={isEditing || step === "done" ? "default" : "secondary"}>
            {isEditing ? (
              <>
                <Check className="size-3 mr-1" />
                Published
              </>
            ) : step === "done" ? (
              <>
                <Check className="size-3 mr-1" />
                Ready to publish
              </>
            ) : (
              "Draft"
            )}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={runDemo}
            disabled={isRunningDemo}
          >
            <Play className="size-4" />
            {isRunningDemo ? "Running..." : "Run Demo"}
          </Button>
          <Button variant="outline" className="gap-2">
            <HelpCircle className="size-4" />
            How agent builder works
          </Button>
          {isEditing && (
            <Button variant="outline" className="gap-2" onClick={handleDuplicate}>
              <Copy className="size-4" />
              Duplicate
            </Button>
          )}
          <Button onClick={handlePublish} disabled={step !== "done"}>
            {isEditing ? "Save Changes" : "Publish"}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        {/* Left panel - Chat */}
        <div className="flex flex-col flex-1 bg-white rounded-xl">
          {/* Centered Tabs */}
          <div className="flex justify-center pt-4 pb-2">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "create" | "configure")}
            >
              <TabsList className="bg-muted/50">
                <TabsTrigger value="create" className="px-8">Create</TabsTrigger>
                <TabsTrigger value="configure" className="px-8">Configure</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {activeTab === "create" ? (
            <>
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    <div
                      className={cn(
                        "flex gap-3",
                        message.role === "user" && "justify-end"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <div className="max-w-[85%]">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {renderMessageContent(message.content)}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-muted rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%]">
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Confirmation buttons */}
                {showConfirmButtons && !isTyping && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleChangeType}>
                      Change agent type
                    </Button>
                    <Button onClick={handleConfirm}>
                      Yes, continue
                    </Button>
                  </div>
                )}

                {/* Knowledge source buttons */}
                {showKnowledgeButtons && !isTyping && (
                  <div className="flex gap-2">
                    {config.agentType === "answer" && (
                      <Button variant="outline" onClick={handleSkipKnowledgeSources}>
                        Skip for now
                      </Button>
                    )}
                    <Button onClick={handleAddKnowledgeSources}>
                      {config.agentType === "knowledge" ? "Select documents" : "Add knowledge sources"}
                    </Button>
                  </div>
                )}

                {/* Workflow buttons */}
                {showWorkflowButtons && !isTyping && (
                  <div className="flex gap-2">
                    <Button onClick={handleAddWorkflows}>
                      Connect workflows
                    </Button>
                  </div>
                )}

                {/* Type Selector (new flow) */}
                {showTypeSelector && !isTyping && (
                  <div className="space-y-3">
                    {(["answer", "knowledge", "workflow"] as const).map((type) => {
                      const typeInfo = AGENT_TYPE_INFO[type];
                      return (
                        <label
                          key={type}
                          className={cn(
                            "flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                            selectedType === type
                              ? "border-primary ring-1 ring-primary bg-white"
                              : "border-muted bg-white hover:border-muted-foreground/30"
                          )}
                        >
                          <input
                            type="radio"
                            name="agent-type"
                            checked={selectedType === type}
                            onChange={() => setSelectedType(type)}
                            className="mt-1.5"
                          />
                          {/* Icon box */}
                          <div className={cn(
                            "size-9 rounded-lg flex items-center justify-center flex-shrink-0",
                            typeInfo.iconBg
                          )}>
                            {type === "answer" && <MessageSquare className={cn("size-4", typeInfo.iconColor)} />}
                            {type === "knowledge" && <BookOpen className={cn("size-4", typeInfo.iconColor)} />}
                            {type === "workflow" && <Workflow className={cn("size-4", typeInfo.iconColor)} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-base">{typeInfo.label}</span>
                              {type === suggestedType && (
                                <Badge variant="secondary" className="text-xs">Suggested</Badge>
                              )}
                            </div>
                            <p className="text-sm text-foreground mt-0.5">
                              {typeInfo.shortDesc}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {typeInfo.subDesc}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                    <div className="pt-2">
                      <Button onClick={handleTypeSelectionConfirm} disabled={!selectedType}>
                        Continue with {selectedType ? AGENT_TYPE_INFO[selectedType].label : "selection"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Type Confirmation UI (new flow) */}
                {showTypeConfirmation && !isTyping && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleTypeConfirmationAdjust}>
                      Adjust
                    </Button>
                    <Button onClick={handleTypeConfirmationConfirm}>
                      Yes, that's correct
                    </Button>
                  </div>
                )}

                {/* Trigger Phrases UI (new flow) */}
                {showTriggerPhrases && !isTyping && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setActiveTab("configure")}>
                      Edit in Configure
                    </Button>
                    <Button onClick={handleTriggerPhrasesConfirm}>
                      Looks good, continue
                    </Button>
                  </div>
                )}

                {/* Guardrails UI (new flow) */}
                {showGuardrails && !isTyping && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <Textarea
                      value={guardrailInput}
                      onChange={(e) => setGuardrailInput(e.target.value)}
                      placeholder="e.g., HR policy questions, IT troubleshooting, payroll issues..."
                      className="min-h-[80px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate multiple items with commas or new lines. Type "none" if the agent should handle all related requests.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleGuardrailsSkip}>
                        None - handle all
                      </Button>
                      <Button onClick={handleGuardrailsSubmit}>
                        Set boundaries
                      </Button>
                    </div>
                  </div>
                )}

                {/* Source/Workflow Selector (new flow) */}
                {showSourceSelector && !isTyping && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    {selectedType === "workflow" ? (
                      // Workflow selection (single select - cards with search for 5+)
                      <>
                        <div className="space-y-1 mb-3">
                          <p className="text-sm font-medium">
                            Select the workflow this agent will execute:
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Choose a workflow from your organization's available automations.
                          </p>
                        </div>

                        {/* Search input - only show if more than 5 workflows */}
                        {AVAILABLE_WORKFLOWS.length > 5 && (
                          <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                              placeholder="Search workflows..."
                              value={sourceSearchQuery}
                              onChange={(e) => setSourceSearchQuery(e.target.value)}
                              className="pl-9"
                            />
                          </div>
                        )}

                        {/* Workflow cards */}
                        <div className={cn(
                          "space-y-2",
                          AVAILABLE_WORKFLOWS.length > 5 && "max-h-[280px] overflow-y-auto"
                        )}>
                          {AVAILABLE_WORKFLOWS
                            .filter((workflow) => {
                              if (!sourceSearchQuery) return true;
                              const query = sourceSearchQuery.toLowerCase();
                              return (
                                workflow.name.toLowerCase().includes(query) ||
                                workflow.description.toLowerCase().includes(query)
                              );
                            })
                            .map((workflow) => (
                              <label
                                key={workflow.id}
                                className={cn(
                                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                  selectedWorkflows[0] === workflow.id
                                    ? "border-primary bg-primary/5"
                                    : "border-transparent bg-white hover:bg-muted/50"
                                )}
                              >
                                <input
                                  type="radio"
                                  name="workflow-selection"
                                  checked={selectedWorkflows[0] === workflow.id}
                                  onChange={() => setSelectedWorkflows([workflow.id])}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-sm">{workflow.name}</span>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {workflow.description}
                                  </p>
                                </div>
                              </label>
                            ))}
                        </div>

                        <div className="pt-2">
                          <Button
                            onClick={handleSourceSelectionConfirm}
                            disabled={selectedWorkflows.length === 0}
                          >
                            Connect workflow
                          </Button>
                        </div>
                      </>
                    ) : (
                      // Knowledge source selection with search
                      <>
                        {/* Search input */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input
                            placeholder="Search knowledge sources..."
                            value={sourceSearchQuery}
                            onChange={(e) => setSourceSearchQuery(e.target.value)}
                            className="pl-9 pr-9"
                          />
                          {sourceSearchQuery && (
                            <button
                              onClick={() => setSourceSearchQuery("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              <X className="size-4" />
                            </button>
                          )}
                        </div>

                        {/* Source list */}
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                          {AVAILABLE_KNOWLEDGE_SOURCES
                            .filter((source) => {
                              if (!sourceSearchQuery) return true;
                              const query = sourceSearchQuery.toLowerCase();
                              return (
                                source.name.toLowerCase().includes(query) ||
                                source.description.toLowerCase().includes(query) ||
                                source.tags.some((tag) => tag.includes(query))
                              );
                            })
                            .map((source) => (
                              <label
                                key={source.id}
                                className={cn(
                                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                  selectedSources.includes(source.id)
                                    ? "border-primary bg-primary/5"
                                    : "border-transparent bg-white hover:bg-muted/50"
                                )}
                              >
                                <Checkbox
                                  checked={selectedSources.includes(source.id)}
                                  onCheckedChange={() => toggleSourceSelection(source.id)}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    {source.type === "upload" ? (
                                      <Upload className="size-4 text-blue-500" />
                                    ) : (
                                      <Link2 className="size-4 text-emerald-500" />
                                    )}
                                    <span className="font-medium">{source.name}</span>
                                    {suggestedSourceIds.includes(source.id) && (
                                      <Badge variant="secondary" className="text-xs gap-1">
                                        <Sparkles className="size-3" />
                                        Suggested
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {source.description}
                                  </p>
                                </div>
                              </label>
                            ))}
                        </div>

                        {/* Selected count and actions */}
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {selectedSources.length} selected
                          </span>
                          <div className="flex gap-2">
                            {selectedType === "answer" && (
                              <Button variant="outline" onClick={handleSourceSelectionConfirm}>
                                Skip for now
                              </Button>
                            )}
                            <Button
                              onClick={handleSourceSelectionConfirm}
                              disabled={selectedType === "knowledge" && selectedSources.length === 0}
                            >
                              {selectedSources.length > 0
                                ? `Connect ${selectedSources.length} source${selectedSources.length !== 1 ? "s" : ""}`
                                : selectedType === "answer"
                                ? "Continue without sources"
                                : "Select at least one document"}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {isTyping && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="size-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                      <span
                        className="size-2 bg-muted-foreground/50 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <span
                        className="size-2 bg-muted-foreground/50 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                    {statusMessage && <span>{statusMessage}</span>}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat input */}
              <div className="p-4">
                <div className="relative">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything"
                    className="min-h-[80px] pr-14 resize-none rounded-xl border-muted-foreground/20"
                    disabled={isTyping || showConfirmButtons || showTypeSelector || showSourceSelector || showTypeConfirmation || showTriggerPhrases || showGuardrails}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping || showConfirmButtons || showTypeSelector || showSourceSelector || showTypeConfirmation || showTriggerPhrases || showGuardrails}
                    aria-label="Send message"
                    className="absolute bottom-3 right-3 size-8 rounded-lg"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Configure tab content - Enhanced */
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto space-y-8">
                {/* Name and Icon Section */}
                <div className="space-y-4">
                  {/* Name of agent with icon picker inline */}
                  <div>
                    <Label htmlFor="agent-name" className="text-sm font-medium">
                      Name of agent
                    </Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Input
                        id="agent-name"
                        value={config.name}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Enter agent name"
                        className="flex-1"
                      />
                      {/* Icon picker button */}
                      <div className="relative">
                        <button
                          onClick={() => setShowIconPicker(!showIconPicker)}
                          className={cn(
                            "size-10 rounded-lg flex items-center justify-center transition-colors border",
                            ICON_COLORS.find(c => c.id === config.iconColorId)?.bg || "bg-slate-800"
                          )}
                          aria-label="Change agent icon"
                        >
                          {(() => {
                            const iconData = AVAILABLE_ICONS.find(i => i.id === config.iconId);
                            const IconComponent = iconData?.icon || Bot;
                            return <IconComponent className="size-5 text-white" />;
                          })()}
                        </button>
                        <ChevronDown className="size-3 text-muted-foreground absolute -bottom-0.5 -right-0.5" />

                        {/* Icon Picker Dropdown */}
                        {showIconPicker && (
                          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 p-4">
                            {/* Color selection */}
                            <div className="mb-4">
                              <p className="text-sm font-medium text-muted-foreground mb-2">Color</p>
                              <div className="flex gap-2">
                                {ICON_COLORS.map((color) => (
                                  <button
                                    key={color.id}
                                    onClick={() => setConfig(prev => ({ ...prev, iconColorId: color.id }))}
                                    className={cn(
                                      "size-10 rounded-full transition-all",
                                      color.bg,
                                      config.iconColorId === color.id
                                        ? "ring-2 ring-offset-2 ring-primary"
                                        : "hover:scale-110"
                                    )}
                                    aria-label={`Select ${color.id} color`}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Icon selection */}
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Icon</p>
                              <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                  placeholder="Find by type, role, or expertise"
                                  value={iconSearchQuery}
                                  onChange={(e) => setIconSearchQuery(e.target.value)}
                                  className="pl-9"
                                />
                              </div>
                              <div className="grid grid-cols-6 gap-1 max-h-[240px] overflow-y-auto">
                                {AVAILABLE_ICONS
                                  .filter(icon => {
                                    if (!iconSearchQuery) return true;
                                    const query = iconSearchQuery.toLowerCase();
                                    return icon.id.includes(query) || icon.keywords.some(k => k.includes(query));
                                  })
                                  .map((iconData) => {
                                    const IconComponent = iconData.icon;
                                    return (
                                      <button
                                        key={iconData.id}
                                        onClick={() => {
                                          setConfig(prev => ({ ...prev, iconId: iconData.id }));
                                          setShowIconPicker(false);
                                          setIconSearchQuery("");
                                        }}
                                        className={cn(
                                          "size-10 rounded-lg flex items-center justify-center transition-colors",
                                          config.iconId === iconData.id
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                        )}
                                      >
                                        <IconComponent className="size-5" />
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="agent-description" className="text-sm font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="agent-description"
                      value={config.description}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Describe what this agent does..."
                      className="mt-1.5 min-h-[60px] resize-none"
                    />
                  </div>
                </div>

                {/* Instructions Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="instructions" className="text-sm font-medium">
                      Instructions
                    </Label>
                    <span className="text-xs text-muted-foreground">Supports Markdown</span>
                  </div>
                  <Textarea
                    id="instructions"
                    value={config.instructions}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, instructions: e.target.value }))
                    }
                    placeholder={`You are a helpful ${config.role || "assistant"}.\n\nYour responsibilities include:\n- ${config.responsibilities || "Helping users with their questions"}\n\nYour job is complete when:\n- ${config.completionCriteria || "The user's question is answered"}`}
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Define how the agent should behave, respond, and what it should avoid.
                  </p>
                </div>

                {/* Conversation Starters Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Conversation starters</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          conversationStarters: [...prev.conversationStarters, ""],
                        }))
                      }
                      disabled={config.conversationStarters.length >= 6}
                    >
                      <Plus className="size-3" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {config.conversationStarters.map((starter, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={starter}
                          onChange={(e) => {
                            const updated = [...config.conversationStarters];
                            updated[index] = e.target.value;
                            setConfig((prev) => ({ ...prev, conversationStarters: updated }));
                          }}
                          placeholder={`Example: "How do I request PTO?"`}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            const updated = config.conversationStarters.filter((_, i) => i !== index);
                            setConfig((prev) => ({ ...prev, conversationStarters: updated }));
                          }}
                          disabled={config.conversationStarters.length <= 1}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Suggested prompts shown to users when starting a conversation.
                  </p>
                </div>

                {/* Agent Type Section */}
                {config.agentType && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Agent Type:</span>
                    <Badge variant="secondary" className="gap-1.5">
                      {config.agentType === "answer" && <MessageSquare className="size-3" />}
                      {config.agentType === "knowledge" && <FileText className="size-3" />}
                      {config.agentType === "workflow" && <Workflow className="size-3" />}
                      {AGENT_TYPE_INFO[config.agentType].label}
                    </Badge>
                    <button
                      onClick={() => {
                        setPendingAgentType(config.agentType);
                        setShowChangeTypeModal(true);
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Knowledge Section - hidden for workflow agents */}
                {config.agentType !== "workflow" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Knowledge</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Documents and data sources the agent can reference
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5">
                        <Plus className="size-3.5" />
                        Add source
                      </Button>
                    </div>

                    {config.knowledgeSources.length > 0 && (
                      <div className="border rounded-lg divide-y">
                        {config.knowledgeSources.map((source, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between px-3 py-2.5"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="size-8 rounded bg-blue-50 flex items-center justify-center">
                                <FileText className="size-4 text-blue-500" />
                              </div>
                              <span className="text-sm">{source}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                const updated = config.knowledgeSources.filter((_, i) => i !== index);
                                setConfig((prev) => ({ ...prev, knowledgeSources: updated }));
                              }}
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions/Workflows Section - hidden for knowledge agents */}
                {config.agentType !== "knowledge" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Actions</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Workflows and automations the agent can execute
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5">
                        <Plus className="size-3.5" />
                        Add action
                      </Button>
                    </div>

                    {config.workflows.length > 0 && (
                      <div className="border rounded-lg divide-y">
                        {config.workflows.map((workflow, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between px-3 py-2.5"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="size-8 rounded bg-purple-50 flex items-center justify-center">
                                <Workflow className="size-4 text-purple-500" />
                              </div>
                              <span className="text-sm">{workflow}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                const updated = config.workflows.filter((_, i) => i !== index);
                                setConfig((prev) => ({ ...prev, workflows: updated }));
                              }}
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Guardrails/Boundaries Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Guardrails</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Topics or requests the agent should NOT handle
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => {
                        setConfig((prev) => ({
                          ...prev,
                          guardrails: [...prev.guardrails, ""],
                        }));
                      }}
                    >
                      <Plus className="size-3.5" />
                      Add guardrail
                    </Button>
                  </div>

                  {config.guardrails.length > 0 && (
                    <div className="space-y-2">
                      {config.guardrails.map((guardrail, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={guardrail}
                            onChange={(e) => {
                              const updated = [...config.guardrails];
                              updated[index] = e.target.value;
                              setConfig((prev) => ({ ...prev, guardrails: updated }));
                            }}
                            placeholder="e.g., HR policy questions"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              const updated = config.guardrails.filter((_, i) => i !== index);
                              setConfig((prev) => ({ ...prev, guardrails: updated }));
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel - Preview */}
        <div className="w-[400px] flex flex-col bg-white rounded-xl">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-medium">Preview</h2>
            {step === "done" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setShowTestModal(true)}
              >
                <Play className="size-3.5" />
                Test agent
              </Button>
            )}
          </div>
          <div className="flex-1 p-4 flex flex-col overflow-y-auto">
            {/* Agent icon and name */}
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "size-12 rounded-xl flex items-center justify-center flex-shrink-0",
                ICON_COLORS.find(c => c.id === config.iconColorId)?.bg || "bg-slate-800"
              )}>
                {(() => {
                  const iconData = AVAILABLE_ICONS.find(i => i.id === config.iconId);
                  const IconComponent = iconData?.icon || Bot;
                  return <IconComponent className="size-6 text-white" />;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium truncate">{config.name || "Untitled Agent"}</h3>
                {config.agentType && (
                  <span className="text-xs text-muted-foreground">
                    {AGENT_TYPE_INFO[config.agentType].shortLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {config.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {config.description}
              </p>
            )}

            {/* Conversation starters / Triggers */}
            {config.conversationStarters.some(s => s.trim()) && (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Try asking
                </p>
                <div className="space-y-1.5">
                  {config.conversationStarters
                    .filter(s => s.trim())
                    .slice(0, 4)
                    .map((starter, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-3 py-2 text-sm border rounded-lg hover:bg-muted/50 transition-colors truncate"
                        disabled
                      >
                        {starter}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Chat input preview */}
            <div className="mt-auto">
              <div className="relative">
                <Textarea
                  placeholder="Ask anything..."
                  className="min-h-[60px] pr-12 resize-none rounded-xl border-muted-foreground/20 text-sm"
                  disabled
                />
                <Button
                  size="icon"
                  disabled
                  aria-label="Send message"
                  className="absolute bottom-2 right-2 size-7 rounded-lg"
                >
                  <Send className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Status indicator - only show when not configured */}
            {!config.description && !config.conversationStarters.some(s => s.trim()) && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 rounded-lg text-sm text-muted-foreground mt-4">
                <Clock className="size-4" />
                <span>Configure your agent to see preview</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-screen Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Test Modal Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTestModal(false)}
                aria-label="Close test mode"
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "size-8 rounded-lg flex items-center justify-center",
                  ICON_COLORS.find(c => c.id === config.iconColorId)?.bg || "bg-slate-800"
                )}>
                  {(() => {
                    const iconData = AVAILABLE_ICONS.find(i => i.id === config.iconId);
                    const IconComponent = iconData?.icon || Bot;
                    return <IconComponent className="size-5 text-white" />;
                  })()}
                </div>
                <div>
                  <h1 className="text-lg font-medium">{config.name}</h1>
                  <p className="text-xs text-muted-foreground">Test Mode</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTestMessages([]);
                  setTestInput("");
                }}
              >
                Clear chat
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTestModal(false)}
              >
                Exit test
              </Button>
            </div>
          </header>

          {/* Test Chat Area */}
          <div className="flex-1 flex justify-center overflow-hidden bg-muted/30">
            <div className="w-full max-w-3xl flex flex-col bg-white border-x">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                {/* Conversation starters - show when no test messages yet or only welcome */}
                {testMessages.length <= 1 && config.conversationStarters.some(s => s.trim()) && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                      Try asking
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {config.conversationStarters
                        .filter(s => s.trim())
                        .slice(0, 4)
                        .map((starter, index) => (
                          <button
                            key={index}
                            onClick={() => handleTestStarterClick(starter)}
                            className="px-4 py-2.5 text-sm border rounded-xl hover:bg-muted/50 transition-colors text-left"
                          >
                            {starter}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {testMessages.map((message) => (
                  <div key={message.id}>
                    <div
                      className={cn(
                        "flex gap-3",
                        message.role === "user" && "justify-end"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <div className="max-w-[80%]">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn(
                              "size-8 rounded-full flex items-center justify-center",
                              ICON_COLORS.find(c => c.id === config.iconColorId)?.bg || "bg-slate-800"
                            )}>
                              {(() => {
                                const iconData = AVAILABLE_ICONS.find(i => i.id === config.iconId);
                                const IconComponent = iconData?.icon || Bot;
                                return <IconComponent className="size-5 text-white" />;
                              })()}
                            </div>
                            <span className="text-sm font-medium">{config.name}</span>
                          </div>
                          <div className="ml-10">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {renderMessageContent(message.content)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[70%]">
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTestTyping && (
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "size-8 rounded-full flex items-center justify-center",
                      ICON_COLORS.find(c => c.id === config.iconColorId)?.bg || "bg-slate-800"
                    )}>
                      {(() => {
                        const iconData = AVAILABLE_ICONS.find(i => i.id === config.iconId);
                        const IconComponent = iconData?.icon || Bot;
                        return <IconComponent className="size-5 text-white" />;
                      })()}
                    </div>
                    <div className="flex gap-1">
                      <span className="size-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                      <span
                        className="size-2 bg-muted-foreground/50 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <span
                        className="size-2 bg-muted-foreground/50 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                )}
                <div ref={testMessagesEndRef} />
              </div>

              {/* Test Input */}
              <div className="p-4 border-t bg-white">
                <div className="relative">
                  <Textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    onKeyDown={handleTestKeyDown}
                    placeholder="Test your agent by asking a question..."
                    className="min-h-[60px] max-h-[120px] pr-14 resize-none rounded-xl border-muted-foreground/20"
                    disabled={isTestTyping}
                  />
                  <Button
                    size="icon"
                    onClick={handleTestSendMessage}
                    disabled={!testInput.trim() || isTestTyping}
                    aria-label="Send test message"
                    className="absolute bottom-3 right-3 size-8 rounded-lg"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  This is a simulated test environment. Responses demonstrate how the agent would behave.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Agent Type Modal */}
      {showChangeTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowChangeTypeModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Change Agent Type</h2>
              <button
                onClick={() => setShowChangeTypeModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Select a new agent type. This will affect available configuration options.
            </p>

            <div className="space-y-2">
              {(["answer", "knowledge", "workflow"] as const).map((type) => {
                const typeInfo = AGENT_TYPE_INFO[type];
                return (
                  <label
                    key={type}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      pendingAgentType === type
                        ? "border-primary ring-1 ring-primary bg-white"
                        : "border-muted bg-white hover:border-muted-foreground/30"
                    )}
                  >
                    <input
                      type="radio"
                      name="change-agent-type"
                      checked={pendingAgentType === type}
                      onChange={() => setPendingAgentType(type)}
                      className="mt-1.5"
                    />
                    {/* Icon box */}
                    <div className={cn(
                      "size-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      typeInfo.iconBg
                    )}>
                      {type === "answer" && <MessageSquare className={cn("size-5", typeInfo.iconColor)} />}
                      {type === "knowledge" && <BookOpen className={cn("size-5", typeInfo.iconColor)} />}
                      {type === "workflow" && <Workflow className={cn("size-5", typeInfo.iconColor)} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{typeInfo.label}</span>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {typeInfo.shortDesc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Show what will change */}
            {pendingAgentType && pendingAgentType !== config.agentType && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-800 mb-2">What will change:</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  {pendingAgentType === "workflow" && config.knowledgeSources.length > 0 && (
                    <li>• Knowledge sources will be removed ({config.knowledgeSources.length} sources)</li>
                  )}
                  {pendingAgentType === "knowledge" && config.workflows.length > 0 && (
                    <li>• Actions/workflows will be removed ({config.workflows.length} workflow)</li>
                  )}
                  {config.agentType === "workflow" && pendingAgentType !== "workflow" && (
                    <li>• Workflow configuration will be cleared</li>
                  )}
                  {config.agentType === "knowledge" && pendingAgentType !== "knowledge" && (
                    <li>• Knowledge-only settings will be adjusted</li>
                  )}
                  <li>• Agent behavior and capabilities will change</li>
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowChangeTypeModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (pendingAgentType && pendingAgentType !== config.agentType) {
                    if (isEditing) {
                      // Show double confirm for existing agents
                      setShowChangeTypeModal(false);
                      setShowConfirmTypeChangeModal(true);
                    } else {
                      // Direct change for new agents
                      setConfig((prev) => ({
                        ...prev,
                        agentType: pendingAgentType,
                        // Clear knowledge sources if switching to workflow
                        knowledgeSources: pendingAgentType === "workflow" ? [] : prev.knowledgeSources,
                        // Clear workflows if switching to knowledge
                        workflows: pendingAgentType === "knowledge" ? [] : prev.workflows,
                      }));
                      setShowChangeTypeModal(false);
                    }
                  }
                }}
                disabled={!pendingAgentType || pendingAgentType === config.agentType}
              >
                {isEditing ? "Continue" : "Confirm Change"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Double Confirm Type Change Modal (for existing agents) */}
      {showConfirmTypeChangeModal && pendingAgentType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowConfirmTypeChangeModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="size-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-medium">Confirm Type Change</h2>
                <p className="text-sm text-muted-foreground">This action affects a saved agent</p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current type:</span>
                <Badge variant="secondary" className="gap-1">
                  {config.agentType === "answer" && <MessageSquare className="size-3" />}
                  {config.agentType === "knowledge" && <FileText className="size-3" />}
                  {config.agentType === "workflow" && <Workflow className="size-3" />}
                  {config.agentType && AGENT_TYPE_INFO[config.agentType].shortLabel}
                </Badge>
              </div>
              <div className="flex items-center justify-center">
                <ArrowLeft className="size-4 text-muted-foreground rotate-180" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New type:</span>
                <Badge variant="default" className="gap-1">
                  {pendingAgentType === "answer" && <MessageSquare className="size-3" />}
                  {pendingAgentType === "knowledge" && <FileText className="size-3" />}
                  {pendingAgentType === "workflow" && <Workflow className="size-3" />}
                  {AGENT_TYPE_INFO[pendingAgentType].shortLabel}
                </Badge>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-medium text-red-800 mb-1">Warning</p>
              <p className="text-sm text-red-700">
                Changing the agent type for <strong>{config.name}</strong> will modify how this agent works.
                Users who interact with this agent may experience different behavior.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmTypeChangeModal(false);
                  setShowChangeTypeModal(true);
                }}
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setConfig((prev) => ({
                    ...prev,
                    agentType: pendingAgentType,
                    // Clear knowledge sources if switching to workflow
                    knowledgeSources: pendingAgentType === "workflow" ? [] : prev.knowledgeSources,
                    // Clear workflows if switching to knowledge
                    workflows: pendingAgentType === "knowledge" ? [] : prev.workflows,
                  }));
                  setShowConfirmTypeChangeModal(false);
                  setPendingAgentType(null);
                }}
              >
                Confirm Change
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPublishModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Publish Agent</h2>
              <button
                onClick={() => setShowPublishModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Review your agent configuration before publishing. Once published, this agent will be available for use.
            </p>

            {/* Agent Summary */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              {/* Agent header with icon */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "size-12 rounded-lg flex items-center justify-center",
                  ICON_COLORS.find((c) => c.id === config.iconColorId)?.bg || "bg-slate-800"
                )}>
                  {(() => {
                    const IconComponent = AVAILABLE_ICONS.find((i) => i.id === config.iconId)?.icon || Squirrel;
                    const colorClass = ICON_COLORS.find((c) => c.id === config.iconColorId)?.text || "text-white";
                    return <IconComponent className={cn("size-6", colorClass)} />;
                  })()}
                </div>
                <div>
                  <h3 className="font-medium">{config.name}</h3>
                  <p className="text-sm text-muted-foreground">{config.description || "No description"}</p>
                </div>
              </div>

              {/* Summary details */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Agent Type</span>
                  <Badge variant="secondary" className="gap-1">
                    {config.agentType === "answer" && <MessageSquare className="size-3" />}
                    {config.agentType === "knowledge" && <BookOpen className="size-3" />}
                    {config.agentType === "workflow" && <Workflow className="size-3" />}
                    {config.agentType && AGENT_TYPE_INFO[config.agentType].shortLabel}
                  </Badge>
                </div>

                {config.agentType !== "workflow" && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Knowledge Sources</span>
                    <span className="font-medium">
                      {config.knowledgeSources.length} connected
                    </span>
                  </div>
                )}

                {config.agentType !== "knowledge" && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Workflows</span>
                    <span className="font-medium">
                      {config.workflows.length} connected
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Conversation Starters</span>
                  <span className="font-medium">
                    {config.conversationStarters.filter(s => s.trim()).length} configured
                  </span>
                </div>

                {config.guardrails.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Guardrails</span>
                    <span className="font-medium">
                      {config.guardrails.length} boundaries set
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> After publishing, this agent will immediately be available for users to interact with.
                You can edit or unpublish it later from the agents list.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowPublishModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmPublish}>
                <Check className="size-4 mr-1" />
                Publish Agent
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
