/**
 * WorkflowRunsChart - Trend chart showing workflow runs over time
 *
 * Displays:
 * - Bar chart with success/failed breakdown
 * - Configurable time range
 */

import { useMemo } from "react";
import type { DashboardFiltersState } from "@/pages/DashboardPage";

interface WorkflowRunsChartProps {
	filters: DashboardFiltersState;
}

interface ChartDataPoint {
	label: string;
	success: number;
	failed: number;
}

// Generate mock data based on filters
function generateMockData(filters: DashboardFiltersState): ChartDataPoint[] {
	const dataPoints: ChartDataPoint[] = [];

	const config = {
		"24h": { count: 24, labelFn: (i: number) => `${i}:00` },
		"7d": { count: 7, labelFn: (i: number) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][(new Date().getDay() - 6 + i) % 7] },
		"30d": { count: 30, labelFn: (i: number) => `Day ${i + 1}` },
		"90d": { count: 12, labelFn: (i: number) => `Week ${i + 1}` },
	}[filters.timeRange];

	for (let i = 0; i < config.count; i++) {
		const baseSuccess = Math.floor(Math.random() * 50) + 30;
		const baseFailed = Math.floor(Math.random() * 10) + 2;

		dataPoints.push({
			label: config.labelFn(i),
			success: baseSuccess,
			failed: baseFailed,
		});
	}

	return dataPoints;
}

export function WorkflowRunsChart({ filters }: WorkflowRunsChartProps) {
	const data = useMemo(() => generateMockData(filters), [filters.timeRange]);

	const maxValue = useMemo(() => {
		return Math.max(...data.map(d => d.success + d.failed));
	}, [data]);

	const totalSuccess = data.reduce((sum, d) => sum + d.success, 0);
	const totalFailed = data.reduce((sum, d) => sum + d.failed, 0);

	return (
		<div className="bg-white border border-neutral-100 rounded-lg p-5">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-normal text-foreground">Workflow Runs</h2>
				<div className="flex items-center gap-4 text-sm">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-sm bg-emerald-500" />
						<span className="text-muted-foreground">Success ({totalSuccess})</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-sm bg-red-400" />
						<span className="text-muted-foreground">Failed ({totalFailed})</span>
					</div>
				</div>
			</div>

			{/* Simple bar chart */}
			<div className="h-64 flex items-end gap-1">
				{data.map((point, index) => {
					const successHeight = (point.success / maxValue) * 100;
					const failedHeight = (point.failed / maxValue) * 100;

					return (
						<div
							key={index}
							className="flex-1 flex flex-col items-center gap-1 group"
						>
							<div className="w-full flex flex-col justify-end h-52">
								{/* Failed bar */}
								<div
									className="w-full bg-red-400 rounded-t transition-all group-hover:opacity-80"
									style={{ height: `${failedHeight}%` }}
								/>
								{/* Success bar */}
								<div
									className="w-full bg-emerald-500 transition-all group-hover:opacity-80"
									style={{ height: `${successHeight}%` }}
								/>
							</div>
							{/* Label - show every nth label based on data count */}
							{(data.length <= 12 || index % Math.ceil(data.length / 12) === 0) && (
								<span className="text-[10px] text-muted-foreground truncate max-w-full">
									{point.label}
								</span>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
