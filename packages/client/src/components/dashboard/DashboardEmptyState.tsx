/**
 * DashboardEmptyState - Animated empty state for dashboard
 *
 * Displays a playful animation with geometric shapes when no workflow data exists
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function DashboardEmptyState() {
	const [isAnimating, setIsAnimating] = useState(true);
	const navigate = useNavigate();

	const restartAnimation = () => {
		setIsAnimating(false);
		setTimeout(() => setIsAnimating(true), 50);
	};

	return (
		<div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
			{/* Animation Container */}
			<div
				className="relative cursor-pointer group"
				onClick={restartAnimation}
				title="Click to replay"
			>
				{/* Subtle glow behind the animation */}
				<div className="absolute inset-0 bg-blue-200/30 blur-3xl rounded-full scale-150 opacity-50" />

				<svg
					key={isAnimating ? "animating" : "reset"}
					xmlns="http://www.w3.org/2000/svg"
					width="220"
					height="144"
					viewBox="0 0 110 72"
					className="relative z-10 drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
					style={{ opacity: 0.9 }}
				>
					<style>
						{`
              .red-quarter {
                animation: ${isAnimating ? "rocking-red 2.4s 0.667s forwards" : "none"};
              }

              .purple-circle {
                transform: translateY(${isAnimating ? "-35px" : "0px"});
                animation: ${isAnimating ? "bounce-purple 1s 0.42s forwards" : "none"};
              }

              .grey-stroke {
                stroke-dashoffset: ${isAnimating ? "-40.5px" : "0px"};
                animation: ${isAnimating ? "trace-stroke 1.6s 0.46s forwards" : "none"};
              }

              @keyframes rocking-red {
                0% {
                  transform-origin: 74px 36px;
                  transform: rotateZ(0deg) translateY(0px);
                  animation-timing-function: cubic-bezier(.62,.01,.55,.99);
                }
                33% {
                  transform-origin: 85.1px 36px;
                  transform: rotateZ(58deg) translateY(1.1px);
                  animation-timing-function: cubic-bezier(.54,-0.08,.51,1);
                }
                55.6% {
                  transform-origin: 83px 36px;
                  transform: rotateZ(30deg) translateY(2.4px);
                  animation-timing-function: cubic-bezier(.52,-0.08,.7,.99);
                }
                75% {
                  transform-origin: 83.5px 36px;
                  transform: rotateZ(52deg) translateY(0.7px);
                  animation-timing-function: cubic-bezier(.53,-0.02,.68,.91);
                }
                90% {
                  transform-origin: 81.5px 36px;
                  transform: rotateZ(41.8deg) translateY(0.5px);
                  animation-timing-function: cubic-bezier(.52,.06,.65,.99);
                }
                100% {
                  transform-origin: 81.5px 36px;
                  transform: rotateZ(45deg) translateY(0px);
                }
              }

              @keyframes bounce-purple {
                0% {
                  transform: translateY(-35px);
                  animation-timing-function: cubic-bezier(.85,.01,.83,.92);
                }
                70% {
                  transform: translateY(0px);
                  animation-timing-function: cubic-bezier(.23,.27,.79,.91);
                }
                85% {
                  transform: translateY(-2px);
                  animation-timing-function: cubic-bezier(.32,.2,.75,.99);
                }
                100% {
                  transform: translateY(0px);
                }
              }

              @keyframes trace-stroke {
                0% {
                  stroke-dashoffset: -40.5px;
                  animation-timing-function: cubic-bezier(.7,-0.02,.72,.8);
                }
                24% {
                  stroke-dashoffset: -31.5px;
                  animation-timing-function: cubic-bezier(.62,.08,.76,.87);
                }
                56% {
                  stroke-dashoffset: -8.2px;
                  animation-timing-function: cubic-bezier(.16,.24,.34,1);
                }
                100% {
                  stroke-dashoffset: 0px;
                }
              }
            `}
					</style>

					{/* Red quarter circle - rocking animation */}
					<path
						className="red-quarter"
						d="M74,18H92A18,18,0,0,1,74,36Z"
						fill="#ff6161"
						fillRule="evenodd"
					/>

					{/* Purple circle - bounce animation */}
					<circle
						className="purple-circle"
						cx="64.96"
						cy="45"
						r="9"
						fill="#716bf1"
					/>

					{/* Grey stroke - trace animation */}
					<path
						className="grey-stroke"
						d="M6.64,49.5l8.86,0a42.86,42.86,0,0,1,9-21l0-9.35"
						fill="none"
						stroke="#81a2b2"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="9"
						strokeDasharray="0.1 500"
					/>

					{/* Blue quarter circle - static */}
					<path
						d="M56,54V18A36,36,0,0,0,20,54Z"
						fill="#33afff"
						fillRule="evenodd"
					/>

					{/* Yellow rectangle - static */}
					<rect x="73.96" y="36" width="18" height="18" fill="#ffce53" />
				</svg>
			</div>

			{/* Text content */}
			<div className="text-center space-y-2">
				<h2 className="text-xl font-semibold text-foreground">
					No workflow data yet
				</h2>
				<p className="text-sm text-muted-foreground max-w-md">
					Create and run workflows to see analytics here. Your dashboard will
					show run statistics, performance metrics, and cost savings.
				</p>
			</div>

			{/* CTA */}
			<Button onClick={() => navigate("/agents")}>Create your first agent</Button>
		</div>
	);
}
