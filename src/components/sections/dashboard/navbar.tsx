import UserMenu from "./user-menu";
import NotificationMenu from "@/components/notification-menu";

export const NavBar = () => {
  return (
    <nav className="fixed w-[calc(100vw-250px)] z-50 border-b bg-white">
      <div className="flex h-14 items-center justify-end px-6 gap-3">
        <NotificationMenu />
        <UserMenu />
      </div>
    </nav>
  );
};
