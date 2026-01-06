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

type CompletionState = "excellent" | "needs_improvement" | "knowledge_gap";

// Mock knowledge sources that were used for these tickets
const USED_KNOWLEDGE_SOURCES = [
	{ id: "1", name: "IT Support FAQ", coverage: "partial", suggestion: "Add troubleshooting steps for VPN issues" },
	{ id: "2", name: "Password Reset Guide", coverage: "good", suggestion: null },
	{ id: "3", name: "Hardware Policies", coverage: "missing", suggestion: "Document laptop replacement process" },
];

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
 * - excellent: ≥80% trusted - high confidence, safe to auto-respond
 * - needs_improvement: 50-79% trusted - some knowledge gaps, keep reviewing or enrich
 * - knowledge_gap: <50% trusted - significant gaps, focus on enriching knowledge
 */
function getCompletionState(stats: ReviewStats): CompletionState {
	if (stats.totalReviewed === 0) return "knowledge_gap";
	const trustedPercentage = (stats.trusted / stats.totalReviewed) * 100;
	if (trustedPercentage >= 80) return "excellent";
	if (trustedPercentage >= 50) return "needs_improvement";
	return "knowledge_gap";
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

	// Dynamic content based on completion state - trust-building, knowledge-focused messaging
	const content = {
		excellent: {
			title: "Great alignment!",
			subtitle: "Rita's responses matched your expectations",
			statLabel: "Trusted",
			message: "Your knowledge base is solid. Ready to enable Auto-Respond?",
		},
		needs_improvement: {
			title: "Getting there!",
			subtitle: "Your feedback is helping Rita learn",
			statLabel: "Trusted",
			message: "Some knowledge gaps were identified. Enriching your sources will improve accuracy.",
		},
		knowledge_gap: {
			title: "Rita needs more context",
			subtitle: "Your feedback highlighted knowledge gaps",
			statLabel: "Trusted",
			message: "The knowledge sources don't fully cover these ticket types. Let's fill in the gaps.",
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
				<div className="flex-1 flex flex-col items-center justify-center gap-6 text-center relative">
					{/* Confetti Canvas - only renders for excellent */}
					{completionState === "excellent" && (
						<Confetti
							ref={confettiRef}
							className="absolute inset-0 w-full h-full pointer-events-none"
						/>
					)}

					{/* Title */}
					<h2 className="text-3xl font-semibold text-foreground">
						{content?.title}
					</h2>

					{/* Subtitle */}
					<p className="text-lg text-muted-foreground">
						{content?.subtitle}
					</p>

					{/* Stats Display */}
					<div className="flex flex-col items-center gap-2 py-6">
						<p className="text-7xl font-serif font-bold text-foreground">
							{stats.trusted}/{stats.totalReviewed}
						</p>
						<p className="text-sm text-muted-foreground">
							{content?.statLabel} responses
						</p>
					</div>

					{/* Thumbs Stats */}
					<div className="flex items-center justify-center gap-6">
						<div className="flex items-center gap-1.5">
							<ThumbsUp className="size-4 text-emerald-500" />
							<span className="text-sm text-muted-foreground">Trusted</span>
							<span className="text-sm font-semibold">
								{stats.trusted}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<ThumbsDown className="size-4 text-amber-500" />
							<span className="text-sm text-muted-foreground">
								Needs context
							</span>
							<span className="text-sm font-semibold">
								{stats.needsImprovement}
							</span>
						</div>
					</div>

					{/* CTA Message */}
					<p className="text-base text-muted-foreground max-w-md">
						{content?.message}
					</p>

					{/* Knowledge Source Suggestions - for knowledge_gap state */}
					{completionState === "knowledge_gap" && (
						<div className="w-full max-w-md mt-4 text-left">
							<p className="text-sm font-medium mb-3">Knowledge sources to enrich:</p>
							<div className="space-y-2">
								{USED_KNOWLEDGE_SOURCES.filter(s => s.suggestion).map((source) => (
									<div
										key={source.id}
										className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
									>
										<FileText className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-amber-900">{source.name}</p>
											<p className="text-xs text-amber-700">{source.suggestion}</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Improve Actions - for needs_improvement state */}
					{completionState === "needs_improvement" && (
						<div className="flex gap-3 mt-2">
							<Button
								variant="outline"
								className="gap-2"
								onClick={handleAddKnowledge}
							>
								<FileText className="size-4" />
								Enrich knowledge
							</Button>
							<Button
								variant="outline"
								className="gap-2"
								onClick={handleConnectSources}
							>
								<Link2 className="size-4" />
								Connect sources
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
					) : completionState === "needs_improvement" ? (
						<>
							<Button variant="outline" onClick={handleKeepReviewing}>
								Keep reviewing
							</Button>
							<Button onClick={handleAddKnowledge}>
								Enrich knowledge
							</Button>
						</>
					) : (
						<>
							<Button variant="outline" onClick={handleKeepReviewing}>
								Review more tickets
							</Button>
							<Button onClick={handleAddKnowledge}>
								Add knowledge
							</Button>
						</>
					)}
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
