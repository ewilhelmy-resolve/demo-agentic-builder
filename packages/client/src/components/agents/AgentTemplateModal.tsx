/**
 * AgentTemplateModal - Select from pre-built agent templates
 *
 * Features:
 * - Search templates
 * - Filter by creator
 * - Template list with preview
 * - Apply template to pre-populate agent builder
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ChevronDown,
  Headphones,
  ShieldCheck,
  Key,
  Users,
  Zap,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  creator: string;
  creatorIcon?: string;
  prompt: string;
  category: string;
  inputs?: { name: string; description: string }[];
}

// Pre-built agent templates
const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "helpdesk-advisor",
    name: "HelpDesk Advisor",
    description: "Answer IT support questions using your knowledge base",
    creator: "Resolve",
    prompt: `IT Support Advisor

Mission
Help employees with IT-related questions and troubleshooting. Provide clear, step-by-step guidance for common technical issues.

Responsibilities
- Answer questions about company software and tools
- Guide users through troubleshooting steps
- Escalate complex issues to IT team when needed
- Provide links to relevant documentation

Completion Criteria
The conversation is complete when the user's IT issue is resolved or properly escalated to the IT team.`,
    category: "IT Support",
  },
  {
    id: "onboarding-guide",
    name: "Onboarding Guide",
    description: "Help new hires navigate their first days at the company",
    creator: "Resolve",
    prompt: `New Employee Onboarding Guide

Mission
Welcome new employees and help them navigate their first days. Provide information about company policies, benefits, and resources.

Responsibilities
- Answer questions about onboarding process
- Explain company policies and procedures
- Direct users to relevant HR resources
- Help with common first-week tasks

Completion Criteria
The conversation is complete when the new hire's question is answered or they are directed to the appropriate resource.`,
    category: "HR",
  },
  {
    id: "password-reset-bot",
    name: "Password Reset Bot",
    description: "Automate password reset requests for employees",
    creator: "Resolve",
    prompt: `Password Reset Assistant

Mission
Help employees reset their passwords securely and efficiently. Verify identity and execute password resets through approved workflows.

Responsibilities
- Verify user identity through security questions
- Execute password reset workflow
- Provide temporary password or reset link
- Guide user through setting new password

Completion Criteria
The conversation is complete when the user has successfully reset their password or the request has been escalated.`,
    category: "IT Support",
  },
  {
    id: "policy-expert",
    name: "Policy Expert",
    description: "Answer questions about company policies from official documents",
    creator: "Resolve",
    prompt: `Company Policy Expert

Mission
Provide accurate answers about company policies by referencing official policy documents. Ensure compliance and consistency in policy interpretation.

Responsibilities
- Answer policy-related questions accurately
- Cite specific policy documents and sections
- Clarify ambiguous policy language
- Direct complex cases to HR or Legal

Completion Criteria
The conversation is complete when the user's policy question is answered with proper citations.`,
    category: "Compliance",
  },
  {
    id: "benefits-advisor",
    name: "Benefits Advisor",
    description: "Help employees understand and navigate their benefits",
    creator: "Resolve",
    prompt: `Employee Benefits Advisor

Mission
Help employees understand their benefits package including health insurance, 401k, PTO, and other perks.

Responsibilities
- Explain benefit options and coverage
- Help with enrollment questions
- Provide deadlines and important dates
- Direct complex questions to HR Benefits team

Completion Criteria
The conversation is complete when the employee understands their benefits or is connected with the appropriate team.`,
    category: "HR",
  },
  {
    id: "access-request",
    name: "Access Request Handler",
    description: "Process system access requests for employees",
    creator: "Resolve",
    prompt: `System Access Request Handler

Mission
Help employees request access to company systems and applications. Verify authorization and process requests through proper channels.

Responsibilities
- Collect access request details
- Verify manager approval requirements
- Submit requests to appropriate systems
- Provide status updates on pending requests

Completion Criteria
The conversation is complete when the access request is submitted or the user is informed of next steps.`,
    category: "IT Support",
  },
];

interface AgentTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: AgentTemplate) => void;
}

export function AgentTemplateModal({
  open,
  onOpenChange,
  onSelectTemplate,
}: AgentTemplateModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [creatorFilter, setCreatorFilter] = useState<"all" | "resolve" | "community">("all");
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(
    AGENT_TEMPLATES[0]
  );

  // Filter templates
  const filteredTemplates = AGENT_TEMPLATES.filter((template) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !template.name.toLowerCase().includes(query) &&
        !template.description.toLowerCase().includes(query) &&
        !template.category.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (creatorFilter === "resolve" && template.creator !== "Resolve") {
      return false;
    }
    if (creatorFilter === "community" && template.creator === "Resolve") {
      return false;
    }
    return true;
  });

  const handleApply = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onOpenChange(false);
    }
  };

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "IT Support":
        return Headphones;
      case "HR":
        return Users;
      case "Compliance":
        return ShieldCheck;
      case "Security":
        return Key;
      default:
        return Bot;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl">Suggested agents</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select an agent template below to get started.
          </p>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden px-6">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Created by
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuCheckboxItem
                  checked={creatorFilter === "all"}
                  onCheckedChange={() => setCreatorFilter("all")}
                >
                  All
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={creatorFilter === "resolve"}
                  onCheckedChange={() => setCreatorFilter("resolve")}
                >
                  Resolve
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={creatorFilter === "community"}
                  onCheckedChange={() => setCreatorFilter("community")}
                >
                  Community
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content area - list + preview */}
          <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
            {/* Template list */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="text-xs text-muted-foreground mb-2 grid grid-cols-[1fr,80px] gap-2">
                <span>Templates</span>
                <span>Creator</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1">
                {filteredTemplates.map((template) => {
                  const Icon = getCategoryIcon(template.category);
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors",
                        "hover:bg-accent",
                        selectedTemplate?.id === template.id
                          ? "border-primary bg-primary/5"
                          : "border-transparent"
                      )}
                    >
                      <div className="grid grid-cols-[1fr,80px] gap-2 items-start">
                        <div className="flex items-start gap-3">
                          <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Icon className="size-4 text-slate-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">
                              {template.name}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {template.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="size-5 rounded bg-blue-600 flex items-center justify-center">
                            <Zap className="size-3 text-white" />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {template.creator}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview pane */}
            <div className="w-[340px] flex-shrink-0 border rounded-lg p-4 bg-slate-50 overflow-y-auto">
              {selectedTemplate ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Prompt</span>
                    <Badge variant="secondary" className="gap-1">
                      <Zap className="size-3" />
                      {selectedTemplate.creator}
                    </Badge>
                  </div>
                  <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground bg-white p-3 rounded border">
                    {selectedTemplate.prompt}
                  </pre>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Select a template to preview
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!selectedTemplate}>
            Apply template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
