/**
 * DashboardFilters - Global filters for dashboard
 *
 * Provides filtering by:
 * - Time range (24h, 7d, 30d, 90d)
 * - Status (all, success, failed, running)
 * - Trigger type (all, manual, scheduled, event)
 */

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuCheckboxItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Calendar, CheckCircle, Zap } from "lucide-react";
import type { DashboardFiltersState, TimeRange, StatusFilter, TriggerFilter } from "@/pages/DashboardPage";

interface DashboardFiltersProps {
	filters: DashboardFiltersState;
	onFiltersChange: (filters: DashboardFiltersState) => void;
}

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
	"24h": "Last 24 hours",
	"7d": "Last 7 days",
	"30d": "Last 30 days",
	"90d": "Last 90 days",
};

const STATUS_LABELS: Record<StatusFilter, string> = {
	all: "All statuses",
	success: "Success",
	failed: "Failed",
	running: "Running",
};

const TRIGGER_LABELS: Record<TriggerFilter, string> = {
	all: "All triggers",
	manual: "Manual",
	scheduled: "Scheduled",
	event: "Event-based",
};

export function DashboardFilters({ filters, onFiltersChange }: DashboardFiltersProps) {
	const updateFilter = <K extends keyof DashboardFiltersState>(
		key: K,
		value: DashboardFiltersState[K]
	) => {
		onFiltersChange({ ...filters, [key]: value });
	};

	return (
		<div className="flex items-center gap-2">
			{/* Time Range Filter */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="gap-2">
						<Calendar className="size-4" />
						{TIME_RANGE_LABELS[filters.timeRange]}
						<ChevronDown className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					{(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((range) => (
						<DropdownMenuCheckboxItem
							key={range}
							checked={filters.timeRange === range}
							onCheckedChange={() => updateFilter("timeRange", range)}
						>
							{TIME_RANGE_LABELS[range]}
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Status Filter */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="gap-2">
						<CheckCircle className="size-4" />
						{STATUS_LABELS[filters.status]}
						<ChevronDown className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					{(Object.keys(STATUS_LABELS) as StatusFilter[]).map((status) => (
						<DropdownMenuCheckboxItem
							key={status}
							checked={filters.status === status}
							onCheckedChange={() => updateFilter("status", status)}
						>
							{STATUS_LABELS[status]}
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Trigger Filter */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" className="gap-2">
						<Zap className="size-4" />
						{TRIGGER_LABELS[filters.trigger]}
						<ChevronDown className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					{(Object.keys(TRIGGER_LABELS) as TriggerFilter[]).map((trigger) => (
						<DropdownMenuCheckboxItem
							key={trigger}
							checked={filters.trigger === trigger}
							onCheckedChange={() => updateFilter("trigger", trigger)}
						>
							{TRIGGER_LABELS[trigger]}
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
