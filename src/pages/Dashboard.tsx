
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingBag, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Utensils
} from 'lucide-react';

const DashboardCard = ({ title, value, icon, description }: { 
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  // This would typically come from API
  const dashboardData = {
    activeOrders: 12,
    dailySales: '$2,450.35',
    customers: 68,
    avgOrderValue: '$36.50',
    avgPreparationTime: '18 min',
    topSellingItems: ['Burger Deluxe', 'Pasta Carbonara', 'Tiramisu']
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your restaurant's performance today</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Active Orders"
          value={dashboardData.activeOrders.toString()}
          icon={<ShoppingBag className="h-4 w-4 text-primary" />}
          description="Orders currently being processed"
        />
        
        <DashboardCard
          title="Today's Sales"
          value={dashboardData.dailySales}
          icon={<DollarSign className="h-4 w-4 text-primary" />}
          description="Total revenue generated today"
        />
        
        <DashboardCard
          title="Customers Today"
          value={dashboardData.customers.toString()}
          icon={<Users className="h-4 w-4 text-primary" />}
          description="Total customers served today"
        />
        
        <DashboardCard
          title="Average Order Value"
          value={dashboardData.avgOrderValue}
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          description="Average spend per transaction"
        />
        
        <DashboardCard
          title="Average Preparation Time"
          value={dashboardData.avgPreparationTime}
          icon={<Clock className="h-4 w-4 text-primary" />}
          description="Time from order to delivery"
        />
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {dashboardData.topSellingItems.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-sm font-medium">{index + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1 h-[300px]">
          <CardHeader>
            <CardTitle>Orders Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">
              Chart will be displayed here
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 h-[300px]">
          <CardHeader>
            <CardTitle>Table Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">
              Table layout will be displayed here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
