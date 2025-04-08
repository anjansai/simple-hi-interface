
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Filter, Plus, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';

type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Served' | 'Completed' | 'Cancelled';

interface Order {
  id: string;
  tableNumber: number;
  items: { name: string; quantity: number; price: number }[];
  status: OrderStatus;
  server: string;
  orderTime: string;
  totalAmount: number;
}

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    tableNumber: 5,
    items: [
      { name: 'Classic Burger', quantity: 2, price: 12.99 },
      { name: 'French Fries', quantity: 1, price: 4.99 },
      { name: 'Vanilla Milkshake', quantity: 2, price: 5.99 }
    ],
    status: 'Preparing',
    server: 'John Doe',
    orderTime: '12:30 PM',
    totalAmount: 42.95
  },
  {
    id: 'ORD-002',
    tableNumber: 3,
    items: [
      { name: 'Caesar Salad', quantity: 1, price: 8.99 },
      { name: 'Margherita Pizza', quantity: 1, price: 14.99 }
    ],
    status: 'Ready',
    server: 'Jane Smith',
    orderTime: '12:45 PM',
    totalAmount: 23.98
  },
  {
    id: 'ORD-003',
    tableNumber: 8,
    items: [
      { name: 'Seafood Pasta', quantity: 2, price: 18.99 },
      { name: 'Garlic Bread', quantity: 1, price: 5.99 },
      { name: 'Tiramisu', quantity: 1, price: 6.99 }
    ],
    status: 'Pending',
    server: 'Michael Johnson',
    orderTime: '1:00 PM',
    totalAmount: 50.96
  },
  {
    id: 'ORD-004',
    tableNumber: 2,
    items: [
      { name: 'Steak', quantity: 1, price: 24.99 },
      { name: 'Mashed Potatoes', quantity: 1, price: 4.99 },
      { name: 'Red Wine', quantity: 1, price: 8.99 }
    ],
    status: 'Served',
    server: 'Sarah Williams',
    orderTime: '12:15 PM',
    totalAmount: 38.97
  },
  {
    id: 'ORD-005',
    tableNumber: 10,
    items: [
      { name: 'Chocolate Cake', quantity: 2, price: 6.99 },
      { name: 'Coffee', quantity: 2, price: 3.99 }
    ],
    status: 'Completed',
    server: 'David Brown',
    orderTime: '11:45 AM',
    totalAmount: 21.96
  }
];

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Preparing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Ready':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Served':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Completed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const Orders: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter orders based on active tab and search term
  const getFilteredOrders = () => {
    let filtered = [...mockOrders];
    
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => 
        order.status.toLowerCase() === activeTab
      );
    }
    
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.server.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage and track customer orders</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> New Order
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Filter className="mr-2 h-4 w-4" /> Filter
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="preparing">Preparing</TabsTrigger>
          <TabsTrigger value="ready">Ready</TabsTrigger>
          <TabsTrigger value="served">Served</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Server</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>Table {order.tableNumber}</TableCell>
                      <TableCell>{order.server}</TableCell>
                      <TableCell>{order.orderTime}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getStatusColor(order.status)}`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ${order.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredOrders.length === 0 && (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">No orders found. Try adjusting your filters.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Orders;
