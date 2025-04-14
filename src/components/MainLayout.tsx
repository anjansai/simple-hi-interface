
import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Home,
  Menu as MenuIcon,
  Users,
  Settings as SettingsIcon,
  PieChart,
  Store,
  Table,
  X,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useMobileSize } from '@/hooks/use-mobile';
import UserAvatar from './UserAvatar';

interface MainLayoutProps {
  children: React.ReactNode;
  showSettings?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, showSettings = true }) => {
  const { isMobile } = useMobileSize();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation items with paths
  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: Home,
    },
    {
      name: "Menu Management",
      path: "/menu",
      icon: MenuIcon,
    },
    {
      name: "Orders",
      path: "/orders",
      icon: CreditCard,
    },
    {
      name: "Tables",
      path: "/tables",
      icon: Table,
    },
    {
      name: "Staff",
      path: "/staff",
      icon: Users,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: PieChart,
    },
  ];

  // Add settings if the user has permission
  if (showSettings) {
    menuItems.push({
      name: "Settings",
      path: "/settings",
      icon: SettingsIcon,
    });
  }

  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Navigation for desktop layout
  const MainNav = (
    <div className="group flex flex-col gap-4 py-2">
      <div className="flex h-12 items-center px-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold"
        >
          <Store className="h-6 w-6" />
          <span className="font-bold">Restaurant Manager</span>
        </Link>
      </div>
      <div className="px-2">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                isActive(item.path)
                  ? "bg-primary-foreground font-medium"
                  : "font-normal"
              )}
              onClick={() => {
                navigate(item.path);
                setOpen(false);
              }}
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 items-start">
        {/* Sidebar for desktop */}
        {!isMobile && (
          <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r bg-background lg:block">
            <ScrollArea className="h-full py-2">
              {MainNav}
            </ScrollArea>
          </aside>
        )}

        {/* Mobile navigation */}
        {isMobile && (
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <MenuIcon className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-16 items-center border-b px-4">
                  <Link
                    to="/"
                    className="flex items-center gap-2 font-semibold"
                    onClick={() => setOpen(false)}
                  >
                    <Store className="h-6 w-6" />
                    <span className="font-bold">Restaurant Manager</span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-6 w-6" />
                    <span className="sr-only">Close navigation</span>
                  </Button>
                </div>
                <div className="grid gap-2 p-2">
                  {MainNav}
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Restaurant Manager</h1>
            </div>
            <UserAvatar />
          </header>
        )}

        {/* Main content */}
        <main className="flex-1 lg:pl-64">
          {/* Desktop top bar */}
          {!isMobile && (
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
              <div className="flex-1" />
              <UserAvatar />
            </header>
          )}
          <div className="container p-6 max-w-7xl">
            <Outlet />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
