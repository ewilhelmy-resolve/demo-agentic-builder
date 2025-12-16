import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ThumbsDown, ThumbsUp, FileText, Link2 } from "lucide-react";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import { useEffect, useRef } from "react";
import type { ReviewStats } from "./ReviewAIResponseSheet";
import { useReviewFeedbackStore } from "@/stores/reviewFeedbackStore";

type CompletionState = "excellent" | "mixed" | "poor";

interface CompletionViewProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	stats: ReviewStats;
	clusterId?: string;
	onEnableAutoRespond?: (stats: ReviewStats) => void;
	onKeepReviewing?: () => void;
	onAddKnowledge?: () => void;
	onConnectSources?: () => void;
}

/**
 * Determines completion state based on trusted percentage
 * - excellent: >70% trusted - show confetti, enable auto-respond
 * - mixed: 30-70% trusted - neutral, keep reviewing
 * - poor: <30% trusted - supportive, guide to improve
 */
function getCompletionState(stats: ReviewStats): CompletionState {
	if (stats.totalReviewed === 0) return "poor";
	const trustedPercentage = (stats.trusted / stats.totalReviewed) * 100;
	if (trustedPercentage > 70) return "excellent";
	if (trustedPercentage >= 30) return "mixed";
	return "poor";
}

/**
 * Completion screen shown after all tickets are reviewed
 *
 * Features:
 * - Conditional confetti (only for excellent results)
 * - Review statistics display
 * - Dynamic CTAs based on review outcome
 *
 * @component
 */
export function CompletionView({
	open,
	onOpenChange,
	stats,
	clusterId,
	onEnableAutoRespond,
	onKeepReviewing,
	onAddKnowledge,
	onConnectSources,
}: CompletionViewProps) {
	const confettiRef = useRef<ConfettiRef>(null);
	const completionState = getCompletionState(stats);
	const { setFeedbackState } = useReviewFeedbackStore();

	// Save feedback state when completion view opens (for banner after close)
	useEffect(() => {
		if (open && clusterId) {
			setFeedbackState(clusterId, completionState, stats);
		}
	}, [open, clusterId, completionState, stats, setFeedbackState]);

	// Fire confetti only for excellent results
	useEffect(() => {
		if (open && completionState === "excellent") {
 			// Small delay to ensure the component is fully mounted
			const timer = setTimeout(() => {
				if (confettiRef.current) {
					confettiRef.current.fire({
						particleCount: 100,
						spread: 70,
						origin: { x: 0.5, y: 0.6 },
					});
				}
			}, 300);

			return () => clearTimeout(timer);
		}
	}, [open, completionState]);

	const handleKeepReviewing = () => {
		onKeepReviewing?.();
		onOpenChange(false);
	};

	const handleEnableAutoRespond = () => {
		onEnableAutoRespond?.(stats);
		onOpenChange(false);
	};

	const handleAddKnowledge = () => {
		onAddKnowledge?.();
		onOpenChange(false);
	};

	const handleConnectSources = () => {
		onConnectSources?.();
		onOpenChange(false);
	};

	// Dynamic content based on completion state
	const content = {
		excellent: {
			title: `You reviewed ${stats.totalReviewed} tickets`,
			subtitle: "Confidence improved by",
			message: "Ready to enable Auto-Respond for this ticket group?",
		},
		mixed: {
			title: `You reviewed ${stats.totalReviewed} tickets`,
			subtitle: "Trusted responses",
			message: "Keep reviewing to improve response quality.",
		},
		poor: {
			title: `You reviewed ${stats.totalReviewed} tickets`,
			subtitle: "Trusted responses",
			message: "Help Rita improve by adding more knowledge.",
		},
	}[completionState];

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				className="flex flex-col gap-6 sm:max-w-2xl w-full p-8"
				aria-describedby={undefined}
			>
				{/* Hidden but accessible header for screen readers */}
				<SheetHeader className="sr-only">
					<SheetTitle>Review Complete</SheetTitle>
				</SheetHeader>

				{/* Content */}
				<div className="flex-1 flex flex-col items-center justify-center gap-13 text-center relative">
					{/* Confetti Canvas - only renders for excellent */}
					{completionState === "excellent" && (
						<Confetti
							ref={confettiRef}
							className="absolute inset-0 w-full h-full pointer-events-none"
							manualstart
						/>
					)}

					{/* Title */}
					<h2 className="text-3xl mb-28 text-foreground">
						{content.title}
					</h2>

					{/* Stats Display */}
					<div className="flex flex-col items-center gap-2">
						<p className="text-2xl font-serif">
							{content.subtitle}
						</p>
						<p className="text-7xl font-serif font-bold text-foreground">
							{stats.confidenceImprovement}%
						</p>
					</div>

					{/* Thumbs Stats */}
					<div className="flex items-center justify-center gap-6">
						<div className="flex items-center gap-1.5">
							<ThumbsDown className="size-4 text-muted-foreground" />
							<span className="text-sm text-muted-foreground">
								Need improvement
							</span>
							<span className="text-sm font-semibold">
								{stats.needsImprovement}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<ThumbsUp className="size-4 text-muted-foreground" />
							<span className="text-sm text-muted-foreground">Trusted</span>
							<span className="text-sm font-semibold">
								{stats.trusted}
							</span>
						</div>
					</div>

					{/* CTA Message */}
					<p className="text-base font-serif">
						{content.message}
					</p>

					{/* Improve Actions - only for poor results */}
					{completionState === "poor" && (
						<div className="flex flex-col gap-3 w-full max-w-sm">
							<Button
								variant="outline"
								className="w-full justify-start gap-3"
								onClick={handleAddKnowledge}
							>
								<FileText className="size-4" />
								Add knowledge articles
							</Button>
							<Button
								variant="outline"
								className="w-full justify-start gap-3"
								onClick={handleConnectSources}
							>
								<Link2 className="size-4" />
								Connect data sources
							</Button>
						</div>
					)}
				</div>

				{/* Footer Actions */}
				<SheetFooter className="flex-row justify-end gap-2">
					{completionState === "excellent" ? (
						<>
							<Button variant="outline" onClick={handleKeepReviewing}>
								Keep reviewing
							</Button>
							<Button onClick={handleEnableAutoRespond}>
								Enable Auto-Respond
							</Button>
						</>
					) : completionState === "mixed" ? (
						<>
							<Button variant="outline" onClick={handleAddKnowledge}>
								Add knowledge
							</Button>
							<Button onClick={handleKeepReviewing}>
								Keep reviewing
							</Button>
						</>
					) : (
						<Button onClick={handleKeepReviewing}>
							Keep reviewing
						</Button>
					)}
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
