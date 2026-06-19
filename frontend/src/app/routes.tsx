import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { LandingPage } from "./components/LandingPage";
import { LinksPage } from "./components/LinksPage";
import { LinkDetailPage } from "./components/LinkDetailPage";
import { AnalyticsPage } from "./components/AnalyticsPage";
import { IssuesPage } from "./components/IssuesPage";
import { SettingsPage } from "./components/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: LandingPage },
      { path: "links", Component: LinksPage },
      { path: "links/:shortCode", Component: LinkDetailPage },
      { path: "analytics", Component: AnalyticsPage },
      { path: "issues", Component: IssuesPage },
      { path: "settings", Component: SettingsPage },
    ],
  },
]);
