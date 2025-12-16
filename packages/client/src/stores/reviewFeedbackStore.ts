import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ReviewStats } from "@/components/tickets/ReviewAIResponseSheet";

type CompletionState = "excellent" | "mixed" | "poor";

interface ReviewFeedbackState {
	clusterId: string;
	state: CompletionState;
	stats: ReviewStats;
	dismissed: boolean;
	timestamp: number;
}

interface ReviewFeedbackStore {
	feedbackState: ReviewFeedbackState | null;
	setFeedbackState: (clusterId: string, state: CompletionState, stats: ReviewStats) => void;
	dismissBanner: () => void;
	clearFeedback: () => void;
	getFeedbackForCluster: (clusterId: string) => ReviewFeedbackState | null;
}

/**
 * Store for persisting review feedback state across page navigation
 * Shows banner on tickets page after poor/mixed review completion
 */
export const useReviewFeedbackStore = create<ReviewFeedbackStore>()(
	persist(
		(set, get) => ({
			feedbackState: null,

			setFeedbackState: (clusterId, state, stats) => {
				// Only persist for poor/mixed states
				if (state === "excellent") {
					set({ feedbackState: null });
					return;
				}
				set({
					feedbackState: {
						clusterId,
						state,
						stats,
						dismissed: false,
						timestamp: Date.now(),
					},
				});
			},

			dismissBanner: () => {
				set((s) => ({
					feedbackState: s.feedbackState
						? { ...s.feedbackState, dismissed: true }
						: null,
				}));
			},

			clearFeedback: () => {
				set({ feedbackState: null });
			},

			getFeedbackForCluster: (clusterId) => {
				const state = get().feedbackState;
				if (state && state.clusterId === clusterId && !state.dismissed) {
					return state;
				}
				return null;
			},
		}),
		{
			name: "review-feedback-storage",
		}
	)
);
