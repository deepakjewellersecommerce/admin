import AuthGuard from "@/auth-guard/auth-guard";
import { NavBar } from "@/components/sections/dashboard/navbar";
import Sidebar from "@/components/sections/dashboard/sidebar";
import ErrorBoundary from "@/components/ui/error-boundary";
import { Outlet } from "react-router";

const DashboardLayout = () => {
  return (
    <AuthGuard>
      <div className="bg-gray-50 pl-[250px]">
        <Sidebar className="top-0 left-0 h-screen fixed w-[250px] border-r border-gray-200" />
        <NavBar />
        <main className="pt-20 px-8 pb-8 min-h-screen">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </AuthGuard>
  );
};

export default DashboardLayout;
