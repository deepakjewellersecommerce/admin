import Logo from "@/components/common/logo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { PropsWithClassName } from "@/types";
import { DashboardIcon } from "@radix-ui/react-icons";
import {
  Box,
  Coins,
  GalleryVertical,
  Gift,
  Layers,
  // Paintbrush2,
  PenBox,
  Settings2,
  TicketIcon,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

type Tab = {
  label: string;
  icon?: any;
  href: string;
  subMenu?: Tab[];
};

const Navbar: Tab[] = [
  {
    label: "Dashboard",
    icon: DashboardIcon,
    href: "/",
  },
  {
    label: "Web Settings",
    icon: Settings2,
    href: "/settings/web",
  },
  {
    label: "Metal Pricing",
    icon: Coins,
    href: "/pricing/metals",
  },
  {
    label: "Categories",
    icon: Layers,
    href: "/catalog/categories",
  },
  {
    label: "Banner List",
    icon: GalleryVertical,
    href: "/banners/list",
  },
  // {
  //   label: "Brand List",
  //   icon: BoxIcon,
  //   href: "/brands/list",
  // },
  // Old category management - replaced by Catalog > Categories
  // {
  //   label: "Category",
  //   icon: Grid,
  //   href: "/categories",
  //   subMenu: [
  //     { label: "Add New Category", href: "/categories/add" },
  //     { label: "Category List", href: "/categories/list" },
  //   ],
  // },
  {
    label: "Products",
    icon: Box,
    href: "/products",
    subMenu: [
      { label: "Add Product", href: "/products/add" },
      { label: "Product List", href: "/products/list" },
      // { label: "Upload Products", href: "/products/upload" },
      // { label: "Upload Varients", href: "/products/varients" },
    ],
  },
  {
    label: "Coupons",
    icon: TicketIcon,
    href: "/coupons",
    subMenu: [
      { label: "Add Coupon", href: "/coupons/add" },
      { label: "Coupon List", href: "/coupons/list" },
    ],
  },
  // {
  //   label: "Colors",
  //   icon: Paintbrush2,
  //   href: "/colors",
  //   subMenu: [
  //     { label: "Add Color", href: "/colors/add" },
  //     { label: "Color List", href: "/colors/list" },
  //   ],
  // },
  {
    label: "Orders",
    icon: Box,
    href: "/orders/all",
    subMenu: [
      { label: "All Orders", href: "/orders/list" },
      // { label: "Cancel Order", href: "/orders/cancel" },
    ],
  },
  {
    label: "Customers",
    icon: Users,
    href: "/users",
    subMenu: [{ label: "Customer List", href: "/users/list" }],
  },
  {
    label: "Loyalty",
    icon: Gift,
    href: "/loyalty",
    subMenu: [
      { label: "Loyalty Members", href: "/loyalty/users" },
      { label: "Program Settings", href: "/loyalty/settings" },
    ],
  },
  {
    label: "Blog",
    icon: PenBox,
    href: "/blogs",
    subMenu: [
      { label: "Add Blog", href: "/blogs/add" },
      { label: "Blog List", href: "/blogs/list" },
    ],
  },
];

const Sidebar = ({ className }: PropsWithClassName) => {
  return (
    <aside className={cn("bg-white", className)}>
      <ScrollArea className="h-screen px-3 py-4">
        <span className="block px-4">
          <Logo className="text-primary" />
        </span>
        <div className="mt-8 grid gap-1">
          <Accordion className=" grid gap-1" type="single" collapsible>
            {Navbar.map((tab, i) => (
              <TabButton key={i} tab={tab} />
            ))}
          </Accordion>
        </div>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;

type TabButtonProps = {
  tab: Tab;
} & PropsWithClassName;
const TabButton = ({ className, tab }: TabButtonProps) => {
  let isActive = false;
  const location = useLocation();
  location.pathname === tab.href ? (isActive = true) : (isActive = false);
  const activeStyles = isActive
    ? " text-gray-800  active-sidebar-link shadow group group-active"
    : "";

  if (tab.subMenu)
    return (
      <>
        <AccordionItem className="border-none w-full" value={tab.href}>
          <AccordionTrigger
            className={cn(
              "flex text-gray-600 w-full font-semibold  rounded-md h-11 justify-start",
              activeStyles,
              buttonVariants({ variant: "ghost" }),
              className
            )}
          >
            <div className="flex mr-auto space-x-4">
              <tab.icon size={20} />
              <span className="font-medium tracking-wide text-[15px]">
                {tab.label}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent asChild>
            <div className="flex flex-col  bg-gray-100 rounded-sm">
              {tab.subMenu.map((tab, i) => (
                <Link
                  to={`/dashboard${tab.href}`}
                  className="flex justify-center"
                  key={i}
                >
                  <Button
                    variant={"ghost"}
                    className={cn(
                      "flex text-gray-600  hover:bg-gray-200 md:px-14 px-8 w-full font-semibold -mx-2 rounded-md h-11 justify-start",
                      activeStyles,
                      className
                    )}
                  >
                    <span className=" tracking-wide text-sm font-semibold">
                      {tab.label}
                    </span>
                  </Button>{" "}
                </Link>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </>
    );

  return (
    <Link to={`/dashboard${tab.href}`} className="w-full">
      <Button
        variant={"ghost"}
        className={cn(
          "flex text-gray-600 w-full font-semibold  rounded-md h-11 justify-start",
          activeStyles,
          className
        )}
      >
        <div className="flex  items-center space-x-4">
          <tab.icon size={20} />
          <span className="font-medium tracking-wide text-[15px]">
            {tab.label}
          </span>
        </div>
      </Button>
    </Link>
  );
};
