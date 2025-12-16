import { Button } from "@/components/ui/button";
import { FileText, Link2, X, Lightbulb } from "lucide-react";
import { useReviewFeedbackStore } from "@/stores/reviewFeedbackStore";
import { useNavigate } from "react-router-dom";

interface ReviewFeedbackBannerProps {
	clusterId: string;
}

/**
 * Inline banner shown on cluster detail page after poor/mixed review results
 * Prompts user to add knowledge or connect sources to improve Rita
 */
export function ReviewFeedbackBanner({ clusterId }: ReviewFeedbackBannerProps) {
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

	const handleConnectSources = () => {
		navigate("/settings/connections/knowledge");
		dismissBanner();
	};

	const message =
		state === "poor"
			? `Rita struggled with ${stats.needsImprovement} of ${stats.totalReviewed} responses. Adding more knowledge can help.`
			: `${stats.needsImprovement} of ${stats.totalReviewed} responses need improvement. More context could help Rita do better.`;

	return (
		<div className="mx-6 mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
			<div className="flex items-start gap-3">
				<div className="flex-shrink-0 rounded-full bg-amber-100 p-2">
					<Lightbulb className="size-4 text-amber-600" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium text-amber-900">
						Help Rita improve
					</p>
					<p className="mt-1 text-sm text-amber-700">{message}</p>
					<div className="mt-3 flex flex-wrap gap-2">
						<Button
							size="sm"
							variant="outline"
							className="bg-white"
							onClick={handleAddKnowledge}
						>
							<FileText className="size-4 mr-1.5" />
							Add knowledge articles
						</Button>
						<Button
							size="sm"
							variant="outline"
							className="bg-white"
							onClick={handleConnectSources}
						>
							<Link2 className="size-4 mr-1.5" />
							Connect data sources
						</Button>
					</div>
				</div>
				<button
					onClick={dismissBanner}
					className="flex-shrink-0 rounded p-1 hover:bg-amber-100 transition-colors"
					aria-label="Dismiss"
				>
					<X className="size-4 text-amber-600" />
				</button>
			</div>
		</div>
	);
}
