import {
	createBrowserRouter,
	Outlet,
	RouterProvider,
	ScrollRestoration,
} from "react-router";
import { SiteLayout } from "@/components/SiteLayout/SiteLayout";
import { Changelog } from "@/pages/Changelog/Changelog";
import { ComingSoon, NotFound } from "@/pages/ComingSoon/ComingSoon";
import { Experiments } from "@/pages/Experiments/Experiments";
import { Landing } from "@/pages/Landing/Landing";
import { Pricing } from "@/pages/Pricing/Pricing";
import { WriteUp } from "@/pages/WriteUp/WriteUp";

function Root() {
	return (
		<>
			<ScrollRestoration />
			<Outlet />
		</>
	);
}

const router = createBrowserRouter([
	{
		element: <Root />,
		children: [
			{ path: "/", element: <Landing /> },
			{
				element: <SiteLayout />,
				children: [
					{ path: "/experiments", element: <Experiments /> },
					{ path: "/experiments/:slug", element: <WriteUp /> },
					{ path: "/pricing", element: <Pricing /> },
					{ path: "/changelog", element: <Changelog /> },
					{ path: "/benchmarks", element: <ComingSoon section="benchmarks" /> },
					{ path: "/docs", element: <ComingSoon section="docs" /> },
					{ path: "/download", element: <ComingSoon section="download" /> },
					{ path: "*", element: <NotFound /> },
				],
			},
		],
	},
]);

export function App() {
	return <RouterProvider router={router} />;
}
