/**
 * DevToolsPage - Developer tools and settings
 *
 * Provides access to feature flags and other developer utilities.
 * Uses RitaV1Layout with top nav and left sidebar, but no right panel.
 */

import { FeatureFlagsPanel } from '@/components/devtools/FeatureFlagsPanel'
import RitaLayout from '@/components/layouts/RitaLayout'
import { Button } from '@/components/ui/button'
import { useReviewFeedbackStore } from '@/stores/reviewFeedbackStore'

const DevToolsPage: React.FC = () => {
  const { setFeedbackState, clearFeedback, feedbackState } = useReviewFeedbackStore()

  const triggerExcellentBanner = () => {
    setFeedbackState('email-signatures', 'excellent', {
      totalReviewed: 5,
      trusted: 5,
      needsImprovement: 0,
      confidenceImprovement: 100,
    })
  }

  const triggerNeedsImprovementBanner = () => {
    setFeedbackState('email-signatures', 'needs_improvement', {
      totalReviewed: 5,
      trusted: 3,
      needsImprovement: 2,
      confidenceImprovement: 60,
    })
  }

  const triggerKnowledgeGapBanner = () => {
    setFeedbackState('email-signatures', 'knowledge_gap', {
      totalReviewed: 5,
      trusted: 1,
      needsImprovement: 4,
      confidenceImprovement: 20,
    })
  }

  return (
    <RitaLayout activePage="users">
      <div className="h-full overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Developer Tools</h1>
            <p className="text-sm text-muted-foreground">
              Manage feature flags and developer settings
            </p>
          </div>

          {/* Feature Flags Panel */}
          <FeatureFlagsPanel />

          {/* Review Feedback Banner Testing */}
          <div className="rounded-lg border p-4 space-y-4">
            <h2 className="font-medium">Review Feedback Banner</h2>
            <p className="text-sm text-muted-foreground">
              Test the contextual banners that show on /tickets after review completion
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={triggerExcellentBanner} className="border-emerald-300 text-emerald-700">
                Excellent (≥80%)
              </Button>
              <Button variant="outline" size="sm" onClick={triggerNeedsImprovementBanner} className="border-amber-300 text-amber-700">
                Needs Improvement (50-79%)
              </Button>
              <Button variant="outline" size="sm" onClick={triggerKnowledgeGapBanner} className="border-orange-300 text-orange-700">
                Knowledge Gap (&lt;50%)
              </Button>
              <Button variant="outline" size="sm" onClick={clearFeedback}>
                Clear
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Current state: {feedbackState ? `${feedbackState.state} (dismissed: ${feedbackState.dismissed})` : 'none'}
            </p>
          </div>
        </div>
      </div>
    </RitaLayout>
  )
}

export default DevToolsPage
