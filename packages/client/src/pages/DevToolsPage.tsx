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

  const triggerPoorBanner = () => {
    setFeedbackState('email-signatures', 'poor', {
      totalReviewed: 5,
      trusted: 1,
      needsImprovement: 4,
      confidenceImprovement: 20,
    })
  }

  const triggerMixedBanner = () => {
    setFeedbackState('email-signatures', 'mixed', {
      totalReviewed: 5,
      trusted: 2,
      needsImprovement: 3,
      confidenceImprovement: 40,
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
              Test the banner that shows on /tickets after poor/mixed reviews
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={triggerPoorBanner}>
                Trigger Poor Banner
              </Button>
              <Button variant="outline" size="sm" onClick={triggerMixedBanner}>
                Trigger Mixed Banner
              </Button>
              <Button variant="outline" size="sm" onClick={clearFeedback}>
                Clear Banner
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
