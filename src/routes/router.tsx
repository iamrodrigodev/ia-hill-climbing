import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { HomePage } from "@/pages/HomePage";
import { SimulatorPage } from "@/pages/SimulatorPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "constructor",
        element: <SimulatorPage />,
      },
      {
        path: "herramienta",
        element: <SimulatorPage />,
      },
      {
        path: "simulador",
        element: <SimulatorPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
