/**
 * AgentsTable - Data table for displaying agents list
 *
 * Features:
 * - Sortable columns (status, updated by, owner, last updated)
 * - Row selection with checkboxes
 * - Avatar display for updated by / owner
 * - Status badges
 * - Action menu
 */

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "./AgentCard";

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  updatedBy: {
    initials: string;
    color: string;
  } | null;
  owner: {
    initials: string;
    color: string;
  } | null;
  lastUpdated: string;
}

interface AgentsTableProps {
  agents: Agent[];
  onAgentClick?: (agent: Agent) => void;
  onEdit?: (agent: Agent) => void;
  onDelete?: (agent: Agent) => void;
  onDuplicate?: (agent: Agent) => void;
}

type SortField = "status" | "updatedBy" | "owner" | "lastUpdated";
type SortDirection = "asc" | "desc";

const avatarColors: Record<string, string> = {
  teal: "bg-teal-200",
  purple: "bg-purple-100",
  sky: "bg-sky-200",
  indigo: "bg-indigo-100",
  emerald: "bg-emerald-100",
};

export function AgentsTable({
  agents,
  onAgentClick,
  onEdit,
  onDelete,
  onDuplicate,
}: AgentsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(agents.map((a) => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedAgents = [...agents].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;
    switch (sortField) {
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "updatedBy":
        comparison = (a.updatedBy?.initials || "").localeCompare(
          b.updatedBy?.initials || ""
        );
        break;
      case "owner":
        comparison = (a.owner?.initials || "").localeCompare(
          b.owner?.initials || ""
        );
        break;
      case "lastUpdated":
        comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const allSelected = agents.length > 0 && selectedIds.size === agents.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < agents.length;

  const SortableHeader = ({
    field,
    children,
    align = "left",
  }: {
    field: SortField;
    children: React.ReactNode;
    align?: "left" | "center" | "right";
  }) => (
    <Button
      variant="ghost"
      className={cn(
        "h-9 px-4 gap-2 font-normal text-muted-foreground hover:text-foreground",
        align === "right" && "ml-auto",
        align === "center" && "mx-auto"
      )}
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="size-4" />
    </Button>
  );

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8 pl-3">
              <Checkbox
                checked={allSelected}
                // @ts-expect-error - indeterminate is a valid prop
                indeterminate={someSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all agents"
              />
            </TableHead>
            <TableHead className="min-w-[300px]">Name</TableHead>
            <TableHead className="w-[127px]">
              <SortableHeader field="status">Status</SortableHeader>
            </TableHead>
            <TableHead className="w-[136px]">
              <SortableHeader field="updatedBy" align="center">
                Updated by
              </SortableHeader>
            </TableHead>
            <TableHead className="w-[123px]">
              <SortableHeader field="owner" align="center">
                Owner
              </SortableHeader>
            </TableHead>
            <TableHead className="w-[162px]">
              <SortableHeader field="lastUpdated" align="right">
                Last updated
              </SortableHeader>
            </TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAgents.map((agent) => (
            <TableRow
              key={agent.id}
              className="h-[84px] cursor-pointer"
              onClick={() => onAgentClick?.(agent)}
            >
              <TableCell
                className="pl-3"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={selectedIds.has(agent.id)}
                  onCheckedChange={(checked) =>
                    handleSelectOne(agent.id, checked as boolean)
                  }
                  aria-label={`Select ${agent.name}`}
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-primary font-medium truncate">
                    {agent.name}
                  </span>
                  <span className="text-muted-foreground text-sm truncate">
                    {agent.description}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={agent.status === "published" ? "default" : "outline"}
                >
                  {agent.status === "published" ? "Published" : "Draft"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-center">
                  {agent.updatedBy ? (
                    <Avatar className="size-10">
                      <AvatarFallback
                        className={cn(
                          avatarColors[agent.updatedBy.color] || "bg-muted"
                        )}
                      >
                        {agent.updatedBy.initials}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-center">
                  {agent.owner ? (
                    <Avatar className="size-10">
                      <AvatarFallback
                        className={cn(
                          avatarColors[agent.owner.color] || "bg-muted"
                        )}
                      >
                        {agent.owner.initials}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right text-sm">
                {agent.lastUpdated}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Agent actions"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(agent)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate?.(agent)}>
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete?.(agent)}
                      className="text-destructive focus:text-destructive"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
