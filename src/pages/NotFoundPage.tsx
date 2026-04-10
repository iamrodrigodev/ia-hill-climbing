import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <section className="container section">
      <div className="empty-state">
        <h1>404</h1>
        <p>La ruta solicitada no existe.</p>
        <Button asChild>
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    </section>
  );
}
