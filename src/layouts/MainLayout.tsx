import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { Navbar } from "@/components/navigation/Navbar";

export function MainLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-content">
        <Outlet />
      </main>
      <Toaster position="bottom-left" toastOptions={{ classNames: { toast: "sonner-toast" } }} />
    </div>
  );
}
