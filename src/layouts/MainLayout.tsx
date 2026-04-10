import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { Navbar } from "@/components/navigation/Navbar";

function Footer() {
  return (
      <footer className="footer">
        <div className="container footer-inner">
          <p>Hill Climbing</p>
        </div>
      </footer>
  );
}

export function MainLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-content">
        <Outlet />
      </main>
      <Footer />
      <Toaster position="bottom-left" toastOptions={{ classNames: { toast: "sonner-toast" } }} />
    </div>
  );
}
