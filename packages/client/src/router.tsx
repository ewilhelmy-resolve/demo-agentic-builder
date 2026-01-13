import {
	createBrowserRouter,
	Navigate,
	RouterProvider,
} from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import type { RoleProtectedRoute as _RoleProtectedRoute } from "./components/auth/RoleProtectedRoute";

const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
import { RootLayout } from "./components/layouts/RootLayout";
import { SSEProvider } from "./contexts/SSEContext";
import { useFeatureFlag } from "./hooks/useFeatureFlags";
import ChatV1Page from "./pages/ChatV1Page";
import ConnectionSourceDetailPage from "./pages/ConnectionSourceDetailPage";
import ContactPage from "./pages/ContactPage";
import DevToolsPage from "./pages/DevToolsPage";
import DropdownTestPage from "./pages/DropdownTestPage";
import FilesV1Page from "./pages/FilesV1Page";
import HelpPage from "./pages/HelpPage";
import IframeChatPage from "./pages/IframeChatPage";
import InviteAcceptPage from "./pages/InviteAcceptPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SignUpPage } from "./pages/SignUpPage";
import ProfilePage from "./pages/settings/ProfilePage";
import KnowledgeSources from "./pages/settings/KnowledgeSources";
import ItsmSources from "./pages/settings/ItsmSources";
import TermsOfService from "./pages/TermsOfService";
import TicketsPage from "./pages/TicketsPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import UsersSettingsPage from "./pages/UsersSettingsPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { VerifyEmailSentPage } from "./pages/VerifyEmailSentPage";
import TicketsPage2 from "./pages/TicketsPage2";
import AgentBuilderPageOld from "./components/agent-builder/AgentBuilderPage";
import AgentsPage from "./pages/AgentsPage";
import AgentBuilderPage from "./pages/AgentBuilderPage";
import AgentTestPage from "./pages/AgentTestPage";
import AgentChatPage from "./pages/AgentChatPage";
import DashboardPage from "./pages/DashboardPage";

// Feature-flagged tickets page wrapper
function TicketsPageWithFlag() {
	const enableTicketsV2 = useFeatureFlag("ENABLE_TICKETS_V2");
	return enableTicketsV2 ? <TicketsPage2 /> : <TicketsPage />;
}

// Dev mode wrapper for ChatV1Page with SSE
function ChatV1PageWithSSE() {
	return (
		<SSEProvider apiUrl="" enabled={true}>
			<ChatV1Page />
		</SSEProvider>
	);
}

const router = createBrowserRouter([
	// Root redirect - demo mode goes to agents, normal mode to chat
	{
		path: "/",
		element: <Navigate to={IS_DEMO_MODE ? "/agents" : "/chat"} replace />,
	},
	// Main application routes
	{
		path: "/chat",
		element: <ChatV1PageWithSSE />,
	},
	{
		path: "/chat/:conversationId",
		element: <ChatV1PageWithSSE />,
	},
	// Iframe-embeddable chat routes (minimal UI, public access)
	// NO ProtectedRoute - uses public-guest-user session
	{
		path: "/iframe/chat",
		element: <IframeChatPage />,
	},
	{
		path: "/iframe/chat/:conversationId",
		element: <IframeChatPage />,
	},
	{
		path: "/content",
		element: <FilesV1Page />,
	},
	{
		path: "/tickets",
		element: <TicketsPageWithFlag />,
	},
	{
		path: "/tickets/:id",
		element: <TicketDetailPage />,
	},
	{
		path: "/settings",
		element: <Navigate to="/settings/profile" replace />,
	},
	{
		path: "/settings/profile",
		element: <ProfilePage />,
	},
	{
		path: "/settings/connections",
		element: <Navigate to="/settings/connections/knowledge" replace />,
	},
	{
		path: "/settings/connections/knowledge",
		element: <KnowledgeSources />,
	},
	{
		path: "/settings/connections/knowledge/:id",
		element: <ConnectionSourceDetailPage mode="knowledge" />,
	},
	{
		path: "/settings/connections/itsm",
		element: <ItsmSources />,
	},
	{
		path: "/settings/connections/itsm/:id",
		element: <ConnectionSourceDetailPage mode="itsm" />,
	},
	{
		path: "/settings/users",
		element: <UsersSettingsPage />,
	},
	// Placeholder routes - to be implemented with UX designs
	{
		path: "/account",
		element: (
			<ProtectedRoute>
				{/* Account settings - awaiting UX design */}
				<div>Account settings page (coming soon)</div>
			</ProtectedRoute>
		),
	},
	{
		path: "/contact",
		element: (
			<ProtectedRoute>
				<ContactPage />
			</ProtectedRoute>
		),
	},
	{
		path: "/help",
		element: (
			<ProtectedRoute>
				<HelpPage />
			</ProtectedRoute>
		),
	},
	{
		path: "/payment",
		element: (
			<ProtectedRoute>
				{/* Payment management - awaiting UX design */}
				<div>Payment management (coming soon)</div>
			</ProtectedRoute>
		),
	},
	{
		path: "/analytics",
		element: <DashboardPage />,
	},
	{
		path: "/dashboard",
		element: <DashboardPage />,
	},
	{
		path: "/devtools",
		element: <DevToolsPage />,
	},
	{
		path: "/agent-builder",
		element: <AgentBuilderPageOld />,
	},
	{
		path: "/agents",
		element: <AgentsPage />,
	},
	{
		path: "/agents/create",
		element: <AgentBuilderPage />,
	},
	{
		path: "/agents/:id",
		element: <AgentBuilderPage />,
	},
	{
		path: "/agents/:id/chat",
		element: <AgentChatPage />,
	},
	{
		path: "/agents/:id/test",
		element: <AgentTestPage />,
	},
	{
		path: "/agents/test",
		element: <AgentTestPage />,
	},
	// Test pages (public)
	{
		path: "/test/dropdown",
		element: <DropdownTestPage />,
	},
	// Auth and utility pages
	{
		path: "/",
		element: <RootLayout />,
		children: [
			{
				path: "/login",
				// In demo mode, redirect to agents instead of showing login page
				element: IS_DEMO_MODE ? <Navigate to="/agents" replace /> : <SignUpPage />,
			},
			{
				path: "/verify-email",
				element: <VerifyEmailPage />,
			},
			{
				path: "/verify-email-sent",
				element: <VerifyEmailSentPage />,
			},
			{
				path: "/invite",
				element: <InviteAcceptPage />,
			},
			{
				path: "/terms-of-service",
				element: <TermsOfService />,
			},
			{
				path: "*",
				element: <NotFoundPage />,
			},
		],
	},
]);

export function AppRouter() {
	return <RouterProvider router={router} />;
}
