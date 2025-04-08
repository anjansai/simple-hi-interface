
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, PieChart } from 'lucide-react';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  BarChart as RechartsBarChart, 
  Bar, 
  PieChart as RechartsPieChart,
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { getAll } from '@/lib/mongodb';

const Analytics: React.FC = () => {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real implementation, you'd fetch actual data from MongoDB
    // For now, we're using mock data
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Example of how you would use MongoDB in a real implementation:
        // const salesResult = await getAll('orders');
        // setSalesData(processOrdersIntoSalesData(salesResult));
        
        // Mock data for now
        setSalesData([
          { name: 'Monday', sales: 4000 },
          { name: 'Tuesday', sales: 3000 },
          { name: 'Wednesday', sales: 5000 },
          { name: 'Thursday', sales: 2780 },
          { name: 'Friday', sales: 6890 },
          { name: 'Saturday', sales: 8390 },
          { name: 'Sunday', sales: 4490 },
        ]);
        
        setPopularItems([
          { name: 'Pizza', value: 400, color: '#0088FE' },
          { name: 'Burger', value: 300, color: '#00C49F' },
          { name: 'Pasta', value: 300, color: '#FFBB28' },
          { name: 'Salad', value: 200, color: '#FF8042' },
          { name: 'Dessert', value: 100, color: '#8884d8' },
        ]);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      </div>
      
      <Tabs defaultValue="sales">
        <TabsList className="grid w-full md:w-auto grid-cols-3 mb-4">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <LineChart size={16} /> Sales
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <PieChart size={16} /> Popular Items
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <BarChart size={16} /> Staff Performance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Sales Overview</CardTitle>
              <CardDescription>
                View your restaurant's weekly sales performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <p>Loading data...</p>
                </div>
              ) : error ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <RechartsLineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Menu Items</CardTitle>
              <CardDescription>
                Top selling items at your restaurant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <p>Loading data...</p>
                </div>
              ) : error ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <RechartsPieChart>
                    <Pie
                      dataKey="value"
                      data={popularItems}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label
                    >
                      {popularItems.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Performance</CardTitle>
              <CardDescription>
                Sales and service metrics by staff member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center">
                <p>Staff performance data will be available soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Connect to your MongoDB database to view recent order data.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Revenue Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Connect to your MongoDB database to view revenue insights.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
