import { Medal, MapPin, Trophy, User, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { getAuthUser } from "../services/http";

type SideMenuProps = {
  open: boolean;
  onClose: () => void;
};

const menuItems = [
  { to: "/leaderboards", label: "Ranks", icon: Trophy },
  { to: "/badges", label: "Badges", icon: Medal },
  { to: "/zones", label: "Zones", icon: MapPin },
  { to: "/profile", label: "Profile", icon: User },
];

export default function SideMenu({ open, onClose }: SideMenuProps) {
  const user = getAuthUser();
  const name = user?.name ?? "PlanTree User";

  return (
    <>
      <button
        type="button"
        aria-label="Close menu overlay"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Menu</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
              {name.slice(0, 1)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{name}</p>
              <p className="text-xs text-slate-500">
                {user?.username ?? "Signed in"}
              </p>
            </div>
          </div>
        </div>

        <nav className="p-3">
          <ul className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`
                    }
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
