import Logo from "@/components/common/logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { PropsWithClassName } from "@/types";
import {
  BarChart3,
  Box,
  ChevronDown,
  Coins,
  Gift,
  Layers,
  PenBox,
  Receipt,
  Settings2,
  ShoppingCart,
  TicketIcon,
  TrendingUp,
  Users,
  PackageSearch,
  UsersRound,
  GalleryVertical,
  Rocket,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

type NavItem = {
  label: string;
  icon?: any;
  href: string;
};

type NavGroup = {
  label: string;
  icon: any;
  items: NavItem[];
};

// Dashboard group with analytics sub-pages
const dashboardGroup: NavGroup = {
  label: "Dashboard",
  icon: BarChart3,
  items: [
    { label: "Overview", icon: TrendingUp, href: "/" },
    { label: "KPIs & Alerts", icon: Rocket, href: "/analytics/kpis" },
    { label: "Orders & Revenue", icon: ShoppingCart, href: "/analytics/orders" },
    { label: "Customers", icon: UsersRound, href: "/analytics/customers" },
    { label: "Inventory", icon: PackageSearch, href: "/analytics/inventory" },
    { label: "Financial", icon: Receipt, href: "/analytics/financial" },
  ],
};

// Standalone nav items
const standaloneItems: NavItem[] = [
  { label: "Users", icon: Users, href: "/users/list" },
  { label: "Orders", icon: ShoppingCart, href: "/orders/list" },
  { label: "Products", icon: Box, href: "/products/list" },
  { label: "Categories", icon: Layers, href: "/catalog/categories" },
  { label: "Banners", icon: GalleryVertical, href: "/banners/list" },
  { label: "Coupons", icon: TicketIcon, href: "/coupons/list" },
  { label: "Metal Pricing", icon: Coins, href: "/pricing/metals" },
  { label: "Blog", icon: PenBox, href: "/blogs/list" },
  { label: "Settings", icon: Settings2, href: "/settings/web" },
];

const Sidebar = ({ className }: PropsWithClassName) => {
  const location = useLocation();
  const [dashboardOpen, setDashboardOpen] = useState(() => {
    // Open by default if on dashboard overview or any analytics page
    return location.pathname === "/dashboard" || location.pathname === "/dashboard/";
  });

  const isItemActive = (href: string) => {
    const fullPath = `/dashboard${href}`;
    return location.pathname === fullPath || location.pathname === fullPath + "/";
  };

  const isDashboardSectionActive = dashboardGroup.items.some((item) =>
    isItemActive(item.href)
  );

  return (
    <aside className={cn("bg-white", className)}>
      <ScrollArea className="h-screen py-6">
        {/* Logo */}
        <div className="px-6 mb-8">
          <Logo className="text-primary" thickness="thick" />
        </div>

        {/* Dashboard Group */}
        <div className="px-3">
          <button
            onClick={() => setDashboardOpen(!dashboardOpen)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
              isDashboardSectionActive || dashboardOpen
                ? "text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <div className="flex items-center gap-3">
              <BarChart3 size={20} />
              <span>Dashboard</span>
            </div>
            <ChevronDown
              size={16}
              className={cn(
                "transition-transform duration-200",
                dashboardOpen ? "rotate-180" : ""
              )}
            />
          </button>

          {dashboardOpen && (
            <div className="mt-1 ml-4 space-y-0.5">
              {dashboardGroup.items.map((item) => {
                const active = isItemActive(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} to={`/dashboard${item.href}`}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        active
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      {Icon && <Icon size={18} />}
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="mx-6 my-4 border-t border-gray-100" />

        {/* Standalone Items */}
        <div className="px-3 space-y-0.5">
          {standaloneItems.map((item) => {
            const active = isItemActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.label} to={`/dashboard${item.href}`}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    active
                      ? "bg-gray-100 text-gray-900 font-semibold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;
