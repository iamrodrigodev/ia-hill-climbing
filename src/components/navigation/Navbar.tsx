import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, Network, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Ejemplo" },
  { to: "/constructor", label: "Constructor" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="navbar-shell">
      <div className="container navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Network size={14} />
          </span>
          <span className="brand-text">Hill Climbing</span>
        </Link>

        <nav className="nav-desktop">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => cn("nav-link", isActive && "is-active")}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Button variant="ghost" size="sm" className="mobile-toggle" onClick={() => setOpen((value) => !value)}>
          {open ? <X size={16} /> : <Menu size={16} />}
        </Button>
      </div>

      {open ? (
        <div className="mobile-nav">
          <div className="container mobile-nav-inner">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn("mobile-nav-link", isActive && "is-active")}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
