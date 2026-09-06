import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { SoilAnalysis } from "./components/SoilAnalysis";
import { CropAdvisory } from "./components/CropAdvisory";
import { DiseaseDetection } from "./components/DiseaseDetection";
import { MarketPrices } from "./components/MarketPrices";
import { WeatherDashboard } from "./components/WeatherDashboard";
import { Profile } from "./components/Profile";
import { Login } from "./components/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AgriGames } from "./components/AgriGames";
import { ReferencePapers } from "./components/ReferencePapers";
import { Communication } from "./components/Communication";

export const router = createBrowserRouter(
  [
    {
      path: "/login",
      Component: Login,
    },
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, Component: Dashboard },
        { path: "soil-analysis", Component: SoilAnalysis },
        { path: "crop-advisory", Component: CropAdvisory },
        { path: "disease-detection", Component: DiseaseDetection },
        { path: "market-prices", Component: MarketPrices },
        { path: "weather", Component: WeatherDashboard },
        { path: "profile", Component: Profile },
        { path: "agri-games", Component: AgriGames },
        { path: "reference-papers", Component: ReferencePapers },
        { path: "communication", Component: Communication },
      ],
    },
  ],
  {
    basename: "/FarmVision",
  }
);
