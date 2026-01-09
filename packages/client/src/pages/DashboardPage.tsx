/**
 * DashboardPage - Analytics Dashboard
 *
 * Displays workflow analytics including:
 * - Executive Snapshot (KPI cards)
 * - Global filters (time range, status, trigger type)
 * - Workflow runs trend chart
 * - Workflow performance table
 * - Scheduled workflows section
 */

import { useState } from "react";
import RitaLayout from "@/components/layouts/RitaLayout";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardKPICards } from "@/components/dashboard/DashboardKPICards";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { WorkflowRunsChart } from "@/components/dashboard/WorkflowRunsChart";
import { WorkflowPerformanceTable } from "@/components/dashboard/WorkflowPerformanceTable";

// Mock data flag - set to true to show empty state
const HAS_DATA = true;

export type TimeRange = "24h" | "7d" | "30d" | "90d";
export type StatusFilter = "all" | "success" | "failed" | "running";
export type TriggerFilter = "all" | "manual" | "scheduled" | "event";

export interface DashboardFiltersState {
	timeRange: TimeRange;
	status: StatusFilter;
	trigger: TriggerFilter;
}

export default function DashboardPage() {
	const [filters, setFilters] = useState<DashboardFiltersState>({
		timeRange: "7d",
		status: "all",
		trigger: "all",
	});

	// Show empty state if no data
	if (!HAS_DATA) {
		return (
			<RitaLayout activePage="automations">
				<DashboardEmptyState />
			</RitaLayout>
		);
	}

	return (
		<RitaLayout activePage="automations">
			<div className="flex flex-col gap-6 p-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<h1 className="text-xl font-serif text-card-foreground">
						Dashboard
					</h1>
				</div>

				{/* Global Filters */}
				<DashboardFilters filters={filters} onFiltersChange={setFilters} />

				{/* KPI Cards */}
				<DashboardKPICards filters={filters} />

				{/* Workflow Runs Chart */}
				<WorkflowRunsChart filters={filters} />

				{/* Workflow Performance Table */}
				<WorkflowPerformanceTable filters={filters} />
			</div>
		</RitaLayout>
	);
}
