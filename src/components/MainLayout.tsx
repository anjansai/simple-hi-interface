
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { SheetTrigger, Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Home,
  Menu,
  Users,
  CreditCard,
  Table,
  ChefHat,
  BarChart,
  Settings,
  Package,
  MenuSquare,
  User,
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Menu Management', path: '/menu', icon: Menu },
  { name: 'Staff', path: '/staff', icon: Users },
  { name: 'Orders', path: '/orders', icon: MenuSquare },
  { name: 'Tables', path: '/tables', icon: Table },
  { name: 'Kitchen Display', path: '/kitchen', icon: ChefHat },
  { name: 'Inventory', path: '/inventory', icon: Package },
  { name: 'Billing', path: '/billing', icon: CreditCard },
  { name: 'Analytics', path: '/analytics', icon: BarChart },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const MainLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 border-r bg-card">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Restaurant OS</h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                    location.pathname === item.path
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <User size={16} className="text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-muted-foreground">admin@restaurant.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex items-center p-4 border-b w-full fixed top-0 z-50 bg-background">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="py-4 border-b">
              <h1 className="text-xl font-bold">Restaurant OS</h1>
            </div>
            <nav className="py-4">
              <ul className="space-y-1">
                {navigationItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                        location.pathname === item.path
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary'
                      }`}
                    >
                      <item.icon size={18} />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-medium">Restaurant OS</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="md:p-6 p-4 pt-16 md:pt-6 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
