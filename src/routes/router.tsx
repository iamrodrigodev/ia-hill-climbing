import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { NQueensPage } from "@/pages/NQueensPage";
import { BinPackingPage } from "@/pages/BinPackingPage";
import { TaskSchedulingPage } from "@/pages/TaskSchedulingPage";

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
        element: <HomePage />,
      },
      {
        path: "herramienta",
        element: <HomePage />,
      },
      {
        path: "simulador",
        element: <HomePage />,
      },
      {
        path: "n-reinas",
        element: <NQueensPage />,
      },
      {
        path: "bin-packing",
        element: <BinPackingPage />,
      },
      {
        path: "task-scheduling",
        element: <TaskSchedulingPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
