import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/quick-add", label: "Add", icon: "➕" },
  { to: "/transactions", label: "Transactions", icon: "📋" },
  { to: "/friends", label: "Friends", icon: "🤝" },
  { to: "/budgets", label: "Budgets", icon: "🎯" },
  { to: "/goals", label: "Goals", icon: "🏆" },
  { to: "/wallets", label: "Wallets", icon: "👛" },
  { to: "/categories", label: "Categories", icon: "🏷️" },
];

export default function Layout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-app-bg text-text-primary">
      <aside className="hidden sm:flex sm:flex-col fixed inset-y-0 left-0 w-60 bg-navy border-r border-white/10 z-20">
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
          <span className="w-9 h-9 rounded-md bg-brand flex items-center justify-center text-navy shrink-0">
            <Logo className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="text-white text-[15px] font-bold leading-tight truncate">HisabKitab</div>
            <div className="text-brand text-[10px] font-semibold uppercase tracking-widest font-mono mt-0.5">
              Personal Finance
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          <div className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-3 pb-2">Menu</div>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive ? "text-white bg-brand-dim" : "text-white/55 hover:text-white hover:bg-white/7"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-brand rounded-r" />
                  )}
                  <span className="text-base leading-none w-5 text-center shrink-0">{item.icon}</span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-white/55 hover:text-white hover:bg-white/7 transition"
          >
            <span className="text-base leading-none w-5 text-center shrink-0">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen sm:ml-60">
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 pb-24 sm:pb-6 sm:py-6">
          <Outlet />
        </main>

        <nav className="sm:hidden fixed bottom-0 inset-x-0 z-20 bg-navy border-t border-white/10 flex overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 text-[11px] font-medium rounded-md shrink-0 whitespace-nowrap ${
                  isActive ? "text-brand" : "text-white/50"
                }`
              }
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
