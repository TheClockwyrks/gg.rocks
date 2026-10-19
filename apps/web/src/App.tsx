import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  ScrollRestoration,
} from "react-router";
import { AuthProvider } from "@/auth/AuthProvider";
import { GuestOnly, RequireAuth } from "@/auth/guards";
import { SiteLayout } from "@/components/SiteLayout/SiteLayout";
import { accountPaths } from "@/data/site";
import { AccountLayout } from "@/pages/Account/AccountLayout";
import { Billing } from "@/pages/Account/Billing";
import { MyAccount } from "@/pages/Account/MyAccount";
import { Subscription } from "@/pages/Account/Subscription";
import { Login, Signup } from "@/pages/Auth/Auth";
import { Benchmarks } from "@/pages/Benchmarks/Benchmarks";
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
          { path: "/benchmarks", element: <Benchmarks /> },
          { path: "/download", element: <ComingSoon section="download" /> },
          {
            element: <GuestOnly />,
            children: [
              { path: accountPaths.login, element: <Login /> },
              { path: accountPaths.signup, element: <Signup /> },
            ],
          },
          {
            element: <RequireAuth />,
            children: [
              {
                path: accountPaths.account,
                element: <AccountLayout />,
                children: [
                  { index: true, element: <MyAccount /> },
                  {
                    path: accountPaths.subscription,
                    element: <Subscription />,
                  },
                  { path: accountPaths.billing, element: <Billing /> },
                ],
              },
            ],
          },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
