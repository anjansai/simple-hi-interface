
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Users, Clock } from 'lucide-react';

interface TableInfo {
  id: number;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Cleaning';
  occupiedSince?: string;
  reservation?: {
    name: string;
    time: string;
    guests: number;
  };
  server?: string;
  orderStatus?: string;
}

const mockTables: TableInfo[] = [
  { id: 1, capacity: 2, status: 'Available' },
  { 
    id: 2, 
    capacity: 4, 
    status: 'Occupied',
    occupiedSince: '12:30 PM',
    server: 'Jane Smith',
    orderStatus: 'Served'
  },
  { 
    id: 3, 
    capacity: 6, 
    status: 'Occupied', 
    occupiedSince: '1:15 PM',
    server: 'John Doe',
    orderStatus: 'Preparing' 
  },
  { id: 4, capacity: 2, status: 'Available' },
  { 
    id: 5, 
    capacity: 8, 
    status: 'Reserved',
    reservation: {
      name: 'Martinez Family',
      time: '7:30 PM',
      guests: 7
    }
  },
  { id: 6, capacity: 4, status: 'Cleaning' },
  { id: 7, capacity: 4, status: 'Available' },
  { 
    id: 8, 
    capacity: 2, 
    status: 'Occupied',
    occupiedSince: '12:45 PM',
    server: 'Michael Johnson',
    orderStatus: 'Ordered'
  },
  { id: 9, capacity: 6, status: 'Available' },
  { 
    id: 10, 
    capacity: 4, 
    status: 'Reserved',
    reservation: {
      name: 'Garcia Party',
      time: '6:00 PM',
      guests: 4
    }
  },
  { id: 11, capacity: 2, status: 'Available' },
  { id: 12, capacity: 8, status: 'Available' },
];

const getTableStatusColor = (status: string) => {
  switch (status) {
    case 'Available':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Occupied':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Reserved':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Cleaning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const TableCard: React.FC<{ table: TableInfo }> = ({ table }) => {
  return (
    <Card className={`overflow-hidden border-l-4 ${
      table.status === 'Available' ? 'border-l-green-500' :
      table.status === 'Occupied' ? 'border-l-red-500' :
      table.status === 'Reserved' ? 'border-l-blue-500' :
      'border-l-yellow-500'
    }`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold">Table {table.id}</h3>
          <Badge variant="outline" className={`${getTableStatusColor(table.status)}`}>
            {table.status}
          </Badge>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <Users className="h-4 w-4 mr-1" />
          <span>Capacity: {table.capacity}</span>
        </div>
        
        {table.status === 'Occupied' && (
          <>
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <Clock className="h-4 w-4 mr-1" />
              <span>Since: {table.occupiedSince}</span>
            </div>
            <div className="mt-2 pt-2 border-t">
              <div className="text-sm">Server: {table.server}</div>
              <div className="text-sm">Status: {table.orderStatus}</div>
            </div>
          </>
        )}
        
        {table.status === 'Reserved' && table.reservation && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-sm">Reserved for: {table.reservation.name}</div>
            <div className="text-sm">Time: {table.reservation.time}</div>
            <div className="text-sm">Guests: {table.reservation.guests}</div>
          </div>
        )}
        
        <div className="mt-3 flex gap-2">
          {table.status === 'Available' ? (
            <>
              <Button size="sm" className="flex-1">Seat Guests</Button>
              <Button size="sm" variant="outline" className="flex-1">Reserve</Button>
            </>
          ) : table.status === 'Occupied' ? (
            <>
              <Button size="sm" className="flex-1">View Order</Button>
              <Button size="sm" variant="outline" className="flex-1">Bill</Button>
            </>
          ) : table.status === 'Reserved' ? (
            <>
              <Button size="sm" className="flex-1">Check In</Button>
              <Button size="sm" variant="outline" className="flex-1">Cancel</Button>
            </>
          ) : (
            <Button size="sm" className="flex-1">Mark Available</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Tables: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  
  // Filter tables based on active tab
  const getFilteredTables = () => {
    if (activeTab === 'all') return mockTables;
    return mockTables.filter(table => table.status.toLowerCase() === activeTab.toLowerCase());
  };

  const filteredTables = getFilteredTables();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tables</h1>
          <p className="text-muted-foreground">Manage restaurant tables and seating</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-initial">Floor Plan</Button>
          <Button className="flex-1 sm:flex-initial">
            <Plus className="mr-2 h-4 w-4" /> Add Table
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Tables</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="occupied">Occupied</TabsTrigger>
          <TabsTrigger value="reserved">Reserved</TabsTrigger>
          <TabsTrigger value="cleaning">Cleaning</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTables.map((table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>
          
          {filteredTables.length === 0 && (
            <div className="text-center p-8 border rounded-lg">
              <p className="text-muted-foreground">No tables in this category.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tables;
