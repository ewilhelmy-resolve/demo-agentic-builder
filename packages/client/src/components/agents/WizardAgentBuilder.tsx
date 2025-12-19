/**
 * WizardAgentBuilder - Form-based agent builder with live preview
 *
 * Alternative to the chat-driven builder. Features:
 * - Left panel: Structured form fields
 * - Right panel: Live agent preview
 * - Bottom: Chat assistant for help
 * - Tabs: Plan | Build | Validate
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Send,
  ChevronDown,
  HelpCircle,
  Clock,
  Squirrel,
  Bot,
  Headphones,
  ShieldCheck,
  Key,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  X,
  Pencil,
  Play,
  CheckCircle,
  FileText,
  KeyRound,
  Ticket,
  Unlock,
  Globe,
  Download,
  Monitor,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Icon options for the agent
const ICON_OPTIONS = [
  { id: "squirrel", icon: Squirrel, label: "Squirrel" },
  { id: "bot", icon: Bot, label: "Bot" },
  { id: "headphones", icon: Headphones, label: "Support" },
  { id: "shield-check", icon: ShieldCheck, label: "Security" },
  { id: "key", icon: Key, label: "Access" },
  { id: "book-open", icon: BookOpen, label: "Knowledge" },
];

const ICON_COLORS = [
  { id: "slate", bg: "bg-slate-800", text: "text-white" },
  { id: "blue", bg: "bg-blue-600", text: "text-white" },
  { id: "emerald", bg: "bg-emerald-600", text: "text-white" },
  { id: "purple", bg: "bg-purple-600", text: "text-white" },
  { id: "orange", bg: "bg-orange-500", text: "text-white" },
];

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

interface WizardAgentBuilderProps {
  initialConfig?: Partial<AgentConfig>;
  onBack: () => void;
  onPublish: (config: AgentConfig) => void;
  isEditing?: boolean;
}

type WizardStep = "setup" | "knowledge" | "actions" | "build";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function WizardAgentBuilder({
  initialConfig,
  onBack,
  onPublish,
  isEditing = false,
}: WizardAgentBuilderProps) {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<WizardStep>("setup");
  const [config, setConfig] = useState<AgentConfig>({
    name: initialConfig?.name || "Untitled Agent",
    description: initialConfig?.description || "",
    instructions: initialConfig?.instructions || "",
    role: initialConfig?.role || "",
    completionCriteria: initialConfig?.completionCriteria || "",
    iconId: initialConfig?.iconId || "squirrel",
    iconColorId: initialConfig?.iconColorId || "slate",
    agentType: initialConfig?.agentType || null,
    conversationStarters: initialConfig?.conversationStarters || ["", "", "", ""],
    knowledgeSources: initialConfig?.knowledgeSources || [],
    actions: initialConfig?.actions || [],
    guardrails: initialConfig?.guardrails || [""],
    interactionStyle: initialConfig?.interactionStyle || "Conversational and friendly",
    contextSwitching: initialConfig?.contextSwitching ?? true,
    ticketCreation: initialConfig?.ticketCreation ?? false,
  });

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<"preview" | "assistant">("preview");
  const [chatInput, setChatInput] = useState("");
  const [previewChatInput, setPreviewChatInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I can help you build a new agent.\nFirst, what kind of agent are you building today?",
    },
  ]);
  const [previewMessages, setPreviewMessages] = useState<ChatMessage[]>([]);

  // Determine if steps are complete
  const isSetupComplete = Boolean(config.name && config.description);
  const steps: WizardStep[] = ["setup", "knowledge", "actions", "build"];
  const stepIndex = steps.indexOf(activeStep);

  const goToNextStep = () => {
    if (stepIndex < steps.length - 1) {
      setActiveStep(steps[stepIndex + 1]);
    }
  };

  const goToPrevStep = () => {
    if (stepIndex > 0) {
      setActiveStep(steps[stepIndex - 1]);
    } else {
      onBack();
    }
  };

  // Get current icon component
  const CurrentIcon = ICON_OPTIONS.find((i) => i.id === config.iconId)?.icon || Squirrel;
  const currentColor = ICON_COLORS.find((c) => c.id === config.iconColorId) || ICON_COLORS[0];

  const handleAssistantChatSubmit = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
    };
    setAssistantMessages((prev) => [...prev, userMessage]);
    setChatInput("");

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAssistantResponse(chatInput, config),
      };
      setAssistantMessages((prev) => [...prev, assistantMessage]);
    }, 800);
  };

  const handlePreviewChatSubmit = () => {
    if (!previewChatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: previewChatInput,
    };
    setPreviewMessages((prev) => [...prev, userMessage]);
    setPreviewChatInput("");

    // Simulate agent response based on config
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAgentPreviewResponse(previewChatInput, config),
      };
      setPreviewMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  return (
    <div className="h-screen flex flex-col bg-muted/40">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="size-4" />
          </Button>
          <span className="font-medium">{config.name || "Untitled Agent"}</span>
          <Badge variant="secondary" className="text-xs">
            {isEditing ? "Published" : "Draft"}
          </Badge>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <HelpCircle className="size-4" />
            How agent builder works
          </Button>
          <Button
            onClick={() => onPublish(config)}
            disabled={!isSetupComplete}
            className="bg-primary"
          >
            Publish
          </Button>
        </div>
      </div>

      {/* Main content - cards on neutral background */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left panel - Form with steps (rounded card) */}
        <div className="flex-1 flex flex-col bg-white rounded-xl overflow-hidden">
          {/* Step Navigation inside left panel */}
          <div className="py-4 px-6">
            <div className="flex items-center gap-3">
              {[
                { id: "setup", label: "Setup", num: 1 },
                { id: "knowledge", label: "Knowledge", num: 2 },
                { id: "actions", label: "Actions", num: 3 },
                { id: "build", label: "Build", num: 4 },
              ].map((step) => {
                const isActive = activeStep === step.id;
                const isPast = stepIndex > ["setup", "knowledge", "actions", "build"].indexOf(step.id);
                const isClickable = step.id === "setup" || isSetupComplete;

                return (
                  <button
                    key={step.id}
                    onClick={() => isClickable && setActiveStep(step.id as WizardStep)}
                    disabled={!isClickable}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                      isActive
                        ? "bg-blue-50 text-foreground border border-blue-100"
                        : isPast
                        ? "bg-white border border-slate-200 text-foreground"
                        : "bg-white border border-slate-200 text-muted-foreground/60",
                      !isClickable && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span>{step.num}.</span>
                    <span>{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form content */}
          <div className="flex-1 overflow-y-auto py-6">
            <div className="max-w-[520px] mx-auto px-6">
              {activeStep === "setup" && (
                <SetupStep
                  config={config}
                  setConfig={setConfig}
                  showIconPicker={showIconPicker}
                  setShowIconPicker={setShowIconPicker}
                  CurrentIcon={CurrentIcon}
                  currentColor={currentColor}
                />
              )}
              {activeStep === "knowledge" && (
                <KnowledgeStep
                  config={config}
                  setConfig={setConfig}
                />
              )}
              {activeStep === "actions" && (
                <ActionsStep
                  config={config}
                  setConfig={setConfig}
                />
              )}
              {activeStep === "build" && (
                <BuildStep
                  config={config}
                  setConfig={setConfig}
                  onTest={() => {
                    navigate("/agents/test", { state: { config } });
                  }}
                />
              )}
            </div>
          </div>

          {/* Static Footer inside card */}
          <div className="px-6 py-4 border-t">
            <div className="max-w-[520px] mx-auto flex items-center justify-end gap-3">
              <Button variant="outline" onClick={goToPrevStep}>
                {activeStep === "setup" ? "Cancel" : "Back"}
              </Button>
              {activeStep === "build" ? (
                <Button onClick={() => onPublish(config)} className="gap-2">
                  <CheckCircle className="size-4" />
                  Publish Agent
                </Button>
              ) : (
                <Button onClick={goToNextStep} disabled={activeStep === "setup" && !isSetupComplete}>
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right panel - Preview / AI Assistant (rounded card) */}
        <div className="w-[400px] flex flex-col bg-white rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="px-4 pt-4">
            <Tabs value={rightPanelTab} onValueChange={(v) => setRightPanelTab(v as "preview" | "assistant")}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            {rightPanelTab === "preview" ? (
              <>
                {/* Agent name and description - Glean style */}
                <div className="mb-6">
                  <h3 className="font-semibold text-xl italic mb-2">{config.name || "Untitled Agent"}</h3>
                  {config.description && (
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  )}
                </div>

                {/* Preview chat area */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                  {previewMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "p-3 rounded-lg max-w-[80%]",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-white border"
                      )}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                </div>

                {/* Preview chat input */}
                <div className="relative mb-3">
                  <div className="border rounded-lg bg-white p-3">
                    <Input
                      value={previewChatInput}
                      onChange={(e) => setPreviewChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handlePreviewChatSubmit();
                        }
                      }}
                      placeholder="Ask anything..."
                      className="border-0 p-0 h-auto focus-visible:ring-0"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <button className="p-1 hover:bg-muted rounded">
                        <Plus className="size-4 text-muted-foreground" />
                      </button>
                      <Button
                        size="icon"
                        className="size-7"
                        onClick={handlePreviewChatSubmit}
                        disabled={!previewChatInput.trim()}
                      >
                        <ArrowLeft className="size-4 rotate-[135deg]" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Conversation starters as chips */}
                {config.conversationStarters.filter(s => s.trim()).length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-xs text-muted-foreground">Conversation starters</span>
                      <HelpCircle className="size-3 text-muted-foreground" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {config.conversationStarters.filter(s => s.trim()).map((starter, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setPreviewChatInput(starter);
                          }}
                          className="px-3 py-1.5 text-sm border rounded-full hover:bg-muted transition-colors"
                        >
                          {starter}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info banner */}
                <div className="flex items-center gap-2 bg-muted/50 border rounded-lg p-3">
                  <Clock className="size-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Changes to your agent will be reflected here.
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* AI Assistant chat */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                  {assistantMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "p-3 rounded-lg max-w-[90%]",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-transparent"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>

                {/* Assistant chat input */}
                <div className="relative">
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAssistantChatSubmit();
                      }
                    }}
                    placeholder="Ask anything"
                    className="pr-12 min-h-[60px] resize-none bg-white"
                  />
                  <Button
                    size="icon"
                    className="absolute right-2 bottom-2 size-8"
                    onClick={handleAssistantChatSubmit}
                    disabled={!chatInput.trim()}
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Setup Step - Name, Description, Instructions (matches Figma design)
function SetupStep({
  config,
  setConfig,
  showIconPicker,
  setShowIconPicker,
  CurrentIcon,
  currentColor,
}: {
  config: AgentConfig;
  setConfig: React.Dispatch<React.SetStateAction<AgentConfig>>;
  showIconPicker: boolean;
  setShowIconPicker: (v: boolean) => void;
  CurrentIcon: React.ElementType;
  currentColor: { id: string; bg: string; text: string };
}) {
  return (
    <div className="space-y-6">
      {/* Name of agent */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Name of agent</label>
        <div className="flex items-center gap-3">
          <Input
            type="text"
            value={config.name === "Untitled Agent" ? "" : config.name}
            onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value || "Untitled Agent" }))}
            placeholder=""
            className="flex-1"
          />
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              className={cn(
                "size-[38px] rounded-lg flex items-center justify-center transition-colors",
                currentColor.bg
              )}
            >
              <CurrentIcon className={cn("size-5", currentColor.text)} />
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => setShowIconPicker(!showIconPicker)}
            >
              <ChevronDown className="size-4" />
            </Button>

            {showIconPicker && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg border shadow-lg p-4 z-10 w-72">
                <p className="text-xs font-medium text-muted-foreground mb-3">Color</p>
                <div className="flex gap-2 mb-4">
                  {ICON_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setConfig((prev) => ({ ...prev, iconColorId: color.id }))}
                      className={cn(
                        "size-8 rounded-lg transition-all",
                        color.bg,
                        config.iconColorId === color.id && "ring-2 ring-offset-2 ring-primary"
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-3">Icon</p>
                <div className="grid grid-cols-6 gap-2">
                  {ICON_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setConfig((prev) => ({ ...prev, iconId: opt.id }));
                          setShowIconPicker(false);
                        }}
                        className={cn(
                          "size-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors",
                          config.iconId === opt.id && "bg-muted ring-1 ring-primary"
                        )}
                      >
                        <Icon className="size-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Description</label>
        <Textarea
          value={config.description}
          onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what this agent will help your team with"
          className="min-h-[76px] resize-none"
        />
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Instructions</label>
        <Textarea
          value={config.instructions}
          onChange={(e) => setConfig((prev) => ({ ...prev, instructions: e.target.value }))}
          placeholder="Define how the agent should behave, respond, and what it should avoid."
          className="min-h-[240px] resize-none"
        />
      </div>
    </div>
  );
}

// Knowledge Step - Toggle for all knowledge + add more sources
function KnowledgeStep({
  config,
  setConfig,
}: {
  config: AgentConfig;
  setConfig: React.Dispatch<React.SetStateAction<AgentConfig>>;
}) {
  const [useAllKnowledge, setUseAllKnowledge] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock uploaded files that can be added
  const availableFiles = [
    { id: "file-1", name: "Employee Handbook 2024.pdf", size: "2.4 MB" },
    { id: "file-2", name: "IT Policies.docx", size: "156 KB" },
    { id: "file-3", name: "Benefits Guide.pdf", size: "1.8 MB" },
    { id: "file-4", name: "Onboarding Checklist.pdf", size: "89 KB" },
    { id: "file-5", name: "Security Guidelines.docx", size: "234 KB" },
  ];

  const addSource = (sourceId: string) => {
    if (!config.knowledgeSources.includes(sourceId)) {
      setConfig((prev) => ({
        ...prev,
        knowledgeSources: [...prev.knowledgeSources, sourceId],
      }));
    }
    setSearchQuery("");
  };

  const removeSource = (sourceId: string) => {
    setConfig((prev) => ({
      ...prev,
      knowledgeSources: prev.knowledgeSources.filter((s) => s !== sourceId),
    }));
  };

  const filteredFiles = availableFiles.filter(
    (f) =>
      !config.knowledgeSources.includes(f.id) &&
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedFiles = availableFiles.filter((f) =>
    config.knowledgeSources.includes(f.id)
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold mb-1">Knowledge sources</h2>
        <p className="text-sm text-muted-foreground">
          Choose which sources to reference. If left blank, the agent only uses its pre-trained data.
        </p>
      </div>

      {/* Use all company knowledge toggle */}
      <div className="flex items-center gap-3">
        <Switch
          checked={useAllKnowledge}
          onCheckedChange={setUseAllKnowledge}
        />
        <span className="text-sm">Use all company knowledge</span>
      </div>

      {/* Search to add more */}
      <div className="relative">
        <div className="border rounded-lg px-4 py-3 bg-muted/30">
          <Input
            type="text"
            placeholder="Search to add files, folders, and more"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Search results dropdown */}
        {searchQuery && filteredFiles.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-[200px] overflow-y-auto">
            <div className="p-2">
              {filteredFiles.map((file) => (
                <button
                  key={file.id}
                  onClick={() => addSource(file.id)}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted text-left"
                >
                  <FileText className="size-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{file.size}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {searchQuery && filteredFiles.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 p-4 text-center">
            <p className="text-sm text-muted-foreground">No matching files found</p>
          </div>
        )}
      </div>

      {/* Add data source button */}
      <Button variant="outline" size="sm" className="gap-2">
        <Plus className="size-4" />
        Add data source
      </Button>

      {/* Selected additional sources */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Additional sources ({selectedFiles.length})
          </h3>
          {selectedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
            >
              <FileText className="size-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-xs text-muted-foreground">{file.size}</div>
              </div>
              <button
                onClick={() => removeSource(file.id)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Actions Step - Modal-based action picker (Glean style)
interface ActionItem {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}

interface ActionCategory {
  name: string;
  actions: ActionItem[];
}

const ACTION_CATEGORIES: ActionCategory[] = [
  {
    name: "ServiceNow Actions",
    actions: [
      { id: "password_reset", name: "Password Reset", description: "Reset user password via ServiceNow", icon: KeyRound },
      { id: "ticket_create", name: "Create Ticket", description: "Open a new support ticket in ServiceNow", icon: Ticket },
      { id: "account_unlock", name: "Unlock Account", description: "Unlock locked AD account via ServiceNow", icon: Unlock },
    ],
  },
  {
    name: "Access Request Actions",
    actions: [
      { id: "vpn_access", name: "VPN Access Request", description: "Request VPN access approval", icon: Globe },
      { id: "software_request", name: "Software Request", description: "Request software installation approval", icon: Download },
      { id: "hardware_request", name: "Hardware Request", description: "Request new hardware procurement", icon: Monitor },
    ],
  },
  {
    name: "Communication Actions",
    actions: [
      { id: "send_email", name: "Send Email", description: "Send an email notification to user", icon: FileText },
      { id: "slack_message", name: "Send Slack Message", description: "Send a direct message in Slack to the user", icon: FileText, comingSoon: true },
      { id: "slack_channel", name: "Send Slack to Channel", description: "Post a message to a specified Slack channel", icon: FileText, comingSoon: true },
    ],
  },
  {
    name: "Custom Actions",
    actions: [
      { id: "webhook", name: "Webhook", description: "Trigger a custom webhook endpoint", icon: Globe, comingSoon: true },
      { id: "api_call", name: "API Call", description: "Make a custom API request", icon: Globe, comingSoon: true },
    ],
  },
];

function ActionsStep({
  config,
  setConfig,
}: {
  config: AgentConfig;
  setConfig: React.Dispatch<React.SetStateAction<AgentConfig>>;
}) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const addAction = (actionId: string) => {
    if (!config.actions.includes(actionId)) {
      setConfig((prev) => ({
        ...prev,
        actions: [...prev.actions, actionId],
      }));
    }
  };

  const removeAction = (actionId: string) => {
    setConfig((prev) => ({
      ...prev,
      actions: prev.actions.filter((a) => a !== actionId),
    }));
  };

  // Get action details by ID
  const getActionById = (id: string): ActionItem | undefined => {
    for (const category of ACTION_CATEGORIES) {
      const action = category.actions.find((a) => a.id === id);
      if (action) return action;
    }
    return undefined;
  };

  // Filter categories and actions based on search
  const filteredCategories = ACTION_CATEGORIES.map((category) => ({
    ...category,
    actions: category.actions.filter(
      (action) =>
        !config.actions.includes(action.id) &&
        (action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
  })).filter((category) => category.actions.length > 0);

  const selectedActions = config.actions
    .map((id) => getActionById(id))
    .filter((a): a is ActionItem => a !== undefined);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold mb-1">Actions</h2>
        <p className="text-sm text-muted-foreground">
          Add actions this agent can perform. Actions are workflows that handle specific tasks.
        </p>
      </div>

      {/* Add action button */}
      <Button variant="outline" onClick={() => setShowModal(true)} className="gap-2">
        <Plus className="size-4" />
        Add action
      </Button>

      {/* Selected actions */}
      {selectedActions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Added actions ({selectedActions.length})
          </h3>
          {selectedActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <div
                key={action.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
              >
                <ActionIcon className="size-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{action.name}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
                <button
                  onClick={() => removeAction(action.id)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add action</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSearchQuery("");
                }}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search actions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
            </div>

            {/* Actions list */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredCategories.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery ? "No actions match your search" : "All actions have been added"}
                </p>
              ) : (
                <div className="space-y-6">
                  {filteredCategories.map((category) => (
                    <div key={category.name}>
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        {category.name}
                      </h3>
                      <div className="space-y-1">
                        {category.actions.map((action) => {
                          const ActionIcon = action.icon;
                          return (
                            <button
                              key={action.id}
                              onClick={() => {
                                if (!action.comingSoon) {
                                  addAction(action.id);
                                }
                              }}
                              disabled={action.comingSoon}
                              className={cn(
                                "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                                action.comingSoon
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:bg-muted"
                              )}
                            >
                              <ActionIcon className="size-5 text-muted-foreground mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{action.name}</span>
                                  {action.comingSoon && (
                                    <span className="text-[10px] font-medium text-orange-500 uppercase tracking-wide">
                                      Coming Soon
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {action.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Interaction style options
const INTERACTION_STYLE_OPTIONS = [
  "Conversational and friendly",
  "Professional",
  "Concise",
  "Comical",
  "Like Spock",
  "Shakespearean",
];

// Build Step - Configuration and testing
function BuildStep({
  config,
  setConfig,
  onTest,
}: {
  config: AgentConfig;
  setConfig: React.Dispatch<React.SetStateAction<AgentConfig>>;
  onTest: () => void;
}) {
  const [editingStyle, setEditingStyle] = useState(false);
  const [customStyle, setCustomStyle] = useState("");
  const [editingStarterIndex, setEditingStarterIndex] = useState<number | null>(null);

  // Conversation starters handlers
  const updateConversationStarter = (index: number, value: string) => {
    setConfig((prev) => {
      const newStarters = [...prev.conversationStarters];
      newStarters[index] = value;
      return { ...prev, conversationStarters: newStarters };
    });
  };

  const addConversationStarter = () => {
    setConfig((prev) => ({
      ...prev,
      conversationStarters: [...prev.conversationStarters, ""],
    }));
  };

  const removeConversationStarter = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      conversationStarters: prev.conversationStarters.filter((_, i) => i !== index),
    }));
  };

  // Guardrails handlers
  const updateGuardrail = (index: number, value: string) => {
    setConfig((prev) => {
      const newGuardrails = [...prev.guardrails];
      newGuardrails[index] = value;
      return { ...prev, guardrails: newGuardrails };
    });
  };

  const addGuardrail = () => {
    setConfig((prev) => ({
      ...prev,
      guardrails: [...prev.guardrails, ""],
    }));
  };

  const removeGuardrail = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      guardrails: prev.guardrails.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h3 className="font-medium mb-3">Agent Summary</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Name</dt>
            <dd>{config.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Knowledge Sources</dt>
            <dd>{config.knowledgeSources.length || "None"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Actions</dt>
            <dd>{config.actions.length || "None"}</dd>
          </div>
        </dl>
      </div>

      {/* Interaction Style */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Interaction Style</label>
        {editingStyle ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {INTERACTION_STYLE_OPTIONS.map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    setConfig((prev) => ({ ...prev, interactionStyle: style }));
                    setEditingStyle(false);
                  }}
                  className="px-3 py-1.5 bg-muted hover:bg-primary hover:text-primary-foreground rounded-full text-sm transition-colors"
                >
                  {style}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Or type custom style..."
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (customStyle) {
                    setConfig((prev) => ({ ...prev, interactionStyle: customStyle }));
                    setEditingStyle(false);
                    setCustomStyle("");
                  }
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingStyle(true)}
            className="w-full px-3 py-2.5 bg-muted rounded-lg text-sm text-left flex items-center justify-between hover:bg-muted/80"
          >
            <span>{config.interactionStyle}</span>
            <Edit2 className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Context Switching Toggle */}
      <div className="flex items-center justify-between py-3 border-b">
        <div>
          <span className="text-sm font-medium">Context Switching</span>
          <p className="text-xs text-muted-foreground">Allow the agent to handle topic changes mid-conversation</p>
        </div>
        <Switch
          checked={config.contextSwitching}
          onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, contextSwitching: checked }))}
        />
      </div>

      {/* Ticket Creation Toggle */}
      <div className="flex items-center justify-between py-3 border-b">
        <div>
          <span className="text-sm font-medium">Ticket Creation</span>
          <p className="text-xs text-muted-foreground">Allow the agent to create support tickets</p>
        </div>
        <Switch
          checked={config.ticketCreation}
          onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, ticketCreation: checked }))}
        />
      </div>

      {/* Conversation Starters - Glean style */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-semibold text-foreground">Conversation starters</label>
          <p className="text-sm text-muted-foreground">
            Add up to 10 short suggested prompts to help users get started with this agent.
          </p>
        </div>
        <div className="space-y-1">
          {config.conversationStarters.filter(s => s.trim()).map((starter, index) => (
            <div key={index} className="flex items-center justify-between py-2 group">
              {editingStarterIndex === index ? (
                <Input
                  value={starter}
                  onChange={(e) => updateConversationStarter(index, e.target.value)}
                  onBlur={() => setEditingStarterIndex(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingStarterIndex(null)}
                  autoFocus
                  className="flex-1 mr-2"
                />
              ) : (
                <span className="text-sm">{starter}</span>
              )}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingStarterIndex(index)}
                  className="p-1.5 hover:bg-muted rounded"
                >
                  <Pencil className="size-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => removeConversationStarter(index)}
                  className="p-1.5 hover:bg-muted rounded"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addConversationStarter}
          className="gap-1"
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {/* Guardrails */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">Guardrails</label>
            <p className="text-xs text-muted-foreground">Topics or requests the agent should NOT handle</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={addGuardrail}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-4" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {config.guardrails.map((guardrail, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={guardrail}
                onChange={(e) => updateGuardrail(index, e.target.value)}
                placeholder="e.g., HR policy questions"
                className="flex-1"
              />
              <button
                onClick={() => removeGuardrail(index)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Test Section - CTA to test page */}
      <div className="p-5 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-lg">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Play className="size-6 text-violet-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1">Test your agent</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Open a test conversation to see how your agent responds before publishing it to users.
            </p>
            <Button className="gap-2" onClick={onTest}>
              <Play className="size-4" />
              Test Agent
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


// Helper to generate assistant responses
function getAssistantResponse(input: string, _config: AgentConfig): string {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes("help") || lowerInput.includes("how")) {
    return "I can help you build your agent! Fill in the form fields to define your agent's behavior. The Name and Description help users understand what the agent does. The Role defines its personality and approach. The Completion Criteria tells the agent when its job is done.";
  }

  if (lowerInput.includes("name") || lowerInput.includes("title")) {
    return "A good agent name should be descriptive and memorable. For example: 'HR Policy Assistant', 'IT Support Helper', or 'Onboarding Guide'.";
  }

  if (lowerInput.includes("role") || lowerInput.includes("persona")) {
    return "The role defines how your agent should behave. Be specific about tone (friendly, professional), expertise area, and any boundaries. Example: 'You are a friendly HR assistant who helps employees understand company policies.'";
  }

  return "I'm here to help you build your agent. You can ask me about any field in the form, or for suggestions on how to configure your agent.";
}

// Helper to generate preview agent responses
function getAgentPreviewResponse(input: string, config: AgentConfig): string {
  const agentName = config.name || "Agent";
  const role = config.role || "assistant";

  if (!config.description && !config.role) {
    return `Hi! I'm ${agentName}. I'm still being configured - add a description and role to see how I'll respond.`;
  }

  return `Based on my role as ${role.slice(0, 50)}${role.length > 50 ? "..." : ""}, I would help you with: "${input}". This is a preview of how the agent will respond once published.`;
}
