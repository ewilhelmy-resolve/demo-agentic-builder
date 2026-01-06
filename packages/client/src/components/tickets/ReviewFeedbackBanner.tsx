import { Button } from "@/components/ui/button";
import { FileText, Link2, X, Lightbulb, CheckCircle, ArrowRight } from "lucide-react";
import { useReviewFeedbackStore } from "@/stores/reviewFeedbackStore";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ReviewFeedbackBannerProps {
	clusterId: string;
	onViewCompleted?: () => void;
}

/**
 * Contextual banner shown on cluster detail page after review completion
 * - excellent: Success banner prompting to view completed tickets
 * - needs_improvement: Amber banner suggesting knowledge enrichment
 * - knowledge_gap: Amber banner with stronger emphasis on adding knowledge
 */
export function ReviewFeedbackBanner({ clusterId, onViewCompleted }: ReviewFeedbackBannerProps) {
	const { getFeedbackForCluster, dismissBanner } = useReviewFeedbackStore();
	const navigate = useNavigate();

	const feedbackState = getFeedbackForCluster(clusterId);

	if (!feedbackState) {
		return null;
	}

	const { state, stats } = feedbackState;

	const handleAddKnowledge = () => {
		navigate("/settings/connections/knowledge");
		dismissBanner();
	};

	const handleViewCompleted = () => {
		onViewCompleted?.();
		dismissBanner();
	};

	// Excellent state - success banner
	if (state === "excellent") {
		return (
			<div className="mx-6 mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
				<div className="flex items-start gap-3">
					<div className="flex-shrink-0 rounded-full bg-emerald-100 p-2">
						<CheckCircle className="size-4 text-emerald-600" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium text-emerald-900">
							Great alignment!
						</p>
						<p className="mt-1 text-sm text-emerald-700">
							{stats.trusted} of {stats.totalReviewed} responses were trusted. These tickets are ready to move to Completed.
						</p>
						<div className="mt-3">
							<Button
								size="sm"
								className="bg-emerald-600 hover:bg-emerald-700"
								onClick={handleViewCompleted}
							>
								View in Completed
								<ArrowRight className="size-4 ml-1.5" />
							</Button>
						</div>
					</div>
					<button
						onClick={dismissBanner}
						className="flex-shrink-0 rounded p-1 hover:bg-emerald-100 transition-colors"
						aria-label="Dismiss"
					>
						<X className="size-4 text-emerald-600" />
					</button>
				</div>
			</div>
		);
	}

	// Needs improvement / Knowledge gap - amber banners
	const bannerContentMap = {
		needs_improvement: {
			title: "Getting there!",
			message: `${stats.needsImprovement} of ${stats.totalReviewed} responses could be improved. Enriching your knowledge sources will help Rita do better.`,
		},
		knowledge_gap: {
			title: "Rita needs more context",
			message: `${stats.needsImprovement} of ${stats.totalReviewed} responses need improvement. The knowledge sources may not fully cover these ticket types.`,
		},
	};

	const bannerContent = bannerContentMap[state as keyof typeof bannerContentMap];

	// Safety check - shouldn't happen but prevents crash
	if (!bannerContent) {
		return null;
	}

	return (
		<div className={cn(
			"mx-6 mb-4 rounded-lg border p-4",
			state === "knowledge_gap"
				? "border-orange-200 bg-orange-50"
				: "border-amber-200 bg-amber-50"
		)}>
			<div className="flex items-start gap-3">
				<div className={cn(
					"flex-shrink-0 rounded-full p-2",
					state === "knowledge_gap" ? "bg-orange-100" : "bg-amber-100"
				)}>
					<Lightbulb className={cn(
						"size-4",
						state === "knowledge_gap" ? "text-orange-600" : "text-amber-600"
					)} />
				</div>
				<div className="flex-1 min-w-0">
					<p className={cn(
						"text-sm font-medium",
						state === "knowledge_gap" ? "text-orange-900" : "text-amber-900"
					)}>
						{bannerContent.title}
					</p>
					<p className={cn(
						"mt-1 text-sm",
						state === "knowledge_gap" ? "text-orange-700" : "text-amber-700"
					)}>
						{bannerContent.message}
					</p>
					<div className="mt-3 flex flex-wrap gap-2">
						<Button
							size="sm"
							variant="outline"
							className="bg-white"
							onClick={handleAddKnowledge}
						>
							<FileText className="size-4 mr-1.5" />
							Enrich knowledge
						</Button>
						{state === "knowledge_gap" && (
							<Button
								size="sm"
								variant="outline"
								className="bg-white"
								onClick={() => navigate("/settings/connections")}
							>
								<Link2 className="size-4 mr-1.5" />
								Connect sources
							</Button>
						)}
					</div>
				</div>
				<button
					onClick={dismissBanner}
					className={cn(
						"flex-shrink-0 rounded p-1 transition-colors",
						state === "knowledge_gap"
							? "hover:bg-orange-100"
							: "hover:bg-amber-100"
					)}
					aria-label="Dismiss"
				>
					<X className={cn(
						"size-4",
						state === "knowledge_gap" ? "text-orange-600" : "text-amber-600"
					)} />
				</button>
			</div>
		</div>
	);
}
