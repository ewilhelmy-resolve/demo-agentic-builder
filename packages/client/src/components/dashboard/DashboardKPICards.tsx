/**
 * DashboardKPICards - Executive Snapshot KPI cards
 *
 * Displays key metrics:
 * - Total workflow runs
 * - Success rate
 * - Unique workflows
 * - Scheduled health
 * - Est. cost savings
 */

import { TrendingUp, TrendingDown, Activity, CheckCircle2, Workflow, Clock, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardFiltersState } from "@/pages/DashboardPage";

interface DashboardKPICardsProps {
	filters: DashboardFiltersState;
}

interface KPICardProps {
	title: string;
	value: string | number;
	change?: number;
	changeLabel?: string;
	icon: React.ReactNode;
	iconBgColor: string;
}

function KPICard({ title, value, change, changeLabel, icon, iconBgColor }: KPICardProps) {
	const isPositive = change !== undefined && change >= 0;

	return (
		<div className="bg-white border border-neutral-100 rounded-lg p-4 flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<span className="text-sm text-muted-foreground">{title}</span>
				<div className={cn("p-2 rounded-lg", iconBgColor)}>
					{icon}
				</div>
			</div>
			<div className="flex items-end justify-between">
				<span className="text-2xl font-semibold text-foreground">{value}</span>
				{change !== undefined && (
					<div className={cn(
						"flex items-center gap-1 text-xs",
						isPositive ? "text-emerald-600" : "text-red-500"
					)}>
						{isPositive ? (
							<TrendingUp className="size-3" />
						) : (
							<TrendingDown className="size-3" />
						)}
						<span>{isPositive ? "+" : ""}{change}%</span>
						{changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
					</div>
				)}
			</div>
		</div>
	);
}

// Mock data based on filters
function getMockKPIData(filters: DashboardFiltersState) {
	// Simulate different data based on time range
	const multiplier = {
		"24h": 0.15,
		"7d": 1,
		"30d": 4,
		"90d": 12,
	}[filters.timeRange];

	return {
		totalRuns: Math.round(1248 * multiplier),
		successRate: 94.2,
		successRateChange: 2.3,
		uniqueWorkflows: 12,
		scheduledHealth: 98,
		scheduledHealthChange: -1,
		costSavings: Math.round(15420 * multiplier),
		costSavingsChange: 18,
	};
}

export function DashboardKPICards({ filters }: DashboardKPICardsProps) {
	const data = getMockKPIData(filters);

	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
			<KPICard
				title="Total Runs"
				value={data.totalRuns.toLocaleString()}
				icon={<Activity className="size-4 text-blue-600" />}
				iconBgColor="bg-blue-50"
			/>
			<KPICard
				title="Success Rate"
				value={`${data.successRate}%`}
				change={data.successRateChange}
				changeLabel="vs prev"
				icon={<CheckCircle2 className="size-4 text-emerald-600" />}
				iconBgColor="bg-emerald-50"
			/>
			<KPICard
				title="Unique Workflows"
				value={data.uniqueWorkflows}
				icon={<Workflow className="size-4 text-purple-600" />}
				iconBgColor="bg-purple-50"
			/>
			<KPICard
				title="Scheduled Health"
				value={`${data.scheduledHealth}%`}
				change={data.scheduledHealthChange}
				icon={<Clock className="size-4 text-amber-600" />}
				iconBgColor="bg-amber-50"
			/>
			<KPICard
				title="Est. Cost Savings"
				value={`$${data.costSavings.toLocaleString()}`}
				change={data.costSavingsChange}
				changeLabel="vs prev"
				icon={<DollarSign className="size-4 text-emerald-600" />}
				iconBgColor="bg-emerald-50"
			/>
		</div>
	);
}
