/**
 * WorkflowPerformanceTable - Table showing workflow performance metrics
 *
 * Displays:
 * - Workflow name
 * - Total runs
 * - Success/Failure rate
 * - Avg duration
 * - Est. cost saved
 * - Last run time
 */

import { useState, useMemo } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardFiltersState } from "@/pages/DashboardPage";

interface WorkflowPerformanceTableProps {
	filters: DashboardFiltersState;
}

interface WorkflowPerformance {
	id: string;
	name: string;
	totalRuns: number;
	successRate: number;
	avgDuration: string;
	costSaved: number;
	lastRun: string;
	status: "healthy" | "warning" | "critical";
}

type SortField = "name" | "totalRuns" | "successRate" | "costSaved";
type SortDirection = "asc" | "desc";

// Mock data
const MOCK_WORKFLOWS: WorkflowPerformance[] = [
	{
		id: "1",
		name: "Password Reset Automation",
		totalRuns: 342,
		successRate: 98.5,
		avgDuration: "45s",
		costSaved: 4250,
		lastRun: "2 min ago",
		status: "healthy",
	},
	{
		id: "2",
		name: "IT Ticket Triage",
		totalRuns: 189,
		successRate: 94.2,
		avgDuration: "1m 12s",
		costSaved: 2890,
		lastRun: "15 min ago",
		status: "healthy",
	},
	{
		id: "3",
		name: "Onboarding Document Check",
		totalRuns: 87,
		successRate: 76.4,
		avgDuration: "2m 30s",
		costSaved: 1240,
		lastRun: "1 hour ago",
		status: "warning",
	},
	{
		id: "4",
		name: "Compliance Report Generator",
		totalRuns: 45,
		successRate: 52.3,
		avgDuration: "5m 15s",
		costSaved: 890,
		lastRun: "3 hours ago",
		status: "critical",
	},
	{
		id: "5",
		name: "Employee Offboarding",
		totalRuns: 23,
		successRate: 100,
		avgDuration: "1m 45s",
		costSaved: 560,
		lastRun: "1 day ago",
		status: "healthy",
	},
	{
		id: "6",
		name: "Software License Audit",
		totalRuns: 12,
		successRate: 91.7,
		avgDuration: "8m 20s",
		costSaved: 320,
		lastRun: "2 days ago",
		status: "healthy",
	},
];

function getStatusBadge(status: WorkflowPerformance["status"]) {
	const config = {
		healthy: { label: "Healthy", variant: "outline" as const, className: "border-emerald-300 text-emerald-700 bg-emerald-50" },
		warning: { label: "Warning", variant: "outline" as const, className: "border-amber-300 text-amber-700 bg-amber-50" },
		critical: { label: "Critical", variant: "outline" as const, className: "border-red-300 text-red-700 bg-red-50" },
	}[status];

	return (
		<Badge variant={config.variant} className={config.className}>
			{config.label}
		</Badge>
	);
}

export function WorkflowPerformanceTable({ filters: _filters }: WorkflowPerformanceTableProps) {
	const [sortField, setSortField] = useState<SortField>("totalRuns");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection("desc");
		}
	};

	const sortedData = useMemo(() => {
		return [...MOCK_WORKFLOWS].sort((a, b) => {
			const aVal = a[sortField];
			const bVal = b[sortField];

			if (typeof aVal === "string" && typeof bVal === "string") {
				return sortDirection === "asc"
					? aVal.localeCompare(bVal)
					: bVal.localeCompare(aVal);
			}

			return sortDirection === "asc"
				? (aVal as number) - (bVal as number)
				: (bVal as number) - (aVal as number);
		});
	}, [sortField, sortDirection]);

	const SortIcon = ({ field }: { field: SortField }) => {
		if (sortField !== field) {
			return <ArrowUpDown className="size-3 text-muted-foreground" />;
		}
		return sortDirection === "asc" ? (
			<ArrowUp className="size-3" />
		) : (
			<ArrowDown className="size-3" />
		);
	};

	return (
		<div className="bg-white border border-neutral-100 rounded-lg p-5">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-normal text-foreground">
					Workflow Performance
				</h2>
				<Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
					View all
					<ExternalLink className="size-3" />
				</Button>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<Button
								variant="ghost"
								size="sm"
								className="gap-1 -ml-3 font-medium"
								onClick={() => handleSort("name")}
							>
								Workflow
								<SortIcon field="name" />
							</Button>
						</TableHead>
						<TableHead>
							<Button
								variant="ghost"
								size="sm"
								className="gap-1 font-medium"
								onClick={() => handleSort("totalRuns")}
							>
								Runs
								<SortIcon field="totalRuns" />
							</Button>
						</TableHead>
						<TableHead>
							<Button
								variant="ghost"
								size="sm"
								className="gap-1 font-medium"
								onClick={() => handleSort("successRate")}
							>
								Success Rate
								<SortIcon field="successRate" />
							</Button>
						</TableHead>
						<TableHead>Avg Duration</TableHead>
						<TableHead>
							<Button
								variant="ghost"
								size="sm"
								className="gap-1 font-medium"
								onClick={() => handleSort("costSaved")}
							>
								Cost Saved
								<SortIcon field="costSaved" />
							</Button>
						</TableHead>
						<TableHead>Last Run</TableHead>
						<TableHead>Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{sortedData.map((workflow) => (
						<TableRow key={workflow.id} className="cursor-pointer hover:bg-muted/50">
							<TableCell className="font-medium">{workflow.name}</TableCell>
							<TableCell>{workflow.totalRuns.toLocaleString()}</TableCell>
							<TableCell>
								<span
									className={cn(
										workflow.successRate >= 90
											? "text-emerald-600"
											: workflow.successRate >= 70
												? "text-amber-600"
												: "text-red-500"
									)}
								>
									{workflow.successRate}%
								</span>
							</TableCell>
							<TableCell className="text-muted-foreground">
								{workflow.avgDuration}
							</TableCell>
							<TableCell className="text-emerald-600">
								${workflow.costSaved.toLocaleString()}
							</TableCell>
							<TableCell className="text-muted-foreground">
								{workflow.lastRun}
							</TableCell>
							<TableCell>{getStatusBadge(workflow.status)}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
