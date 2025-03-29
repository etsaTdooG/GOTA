// EventCalendar.tsx
'use client';
import { ScheduleXCalendar, useNextCalendarApp } from "@schedule-x/react";
import { createViewDay, createViewMonthAgenda, createViewMonthGrid, createViewWeek } from "@schedule-x/calendar";
import '@schedule-x/theme-shadcn/dist/index.css';
import reservationData from '@/app/dashboard/data.json';
import { useMemo, useState, useEffect, useRef } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

// Define types based on the actual data structure
interface Reservation {
  reservation_id: number;
  user_id: string;
  restaurant_id: number;
  table_id: number;
  guest_count: number;
  reservation_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  status: string;
  notes: string | null;
}

interface Restaurant {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export default function EventCalendar() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Extract restaurants from data
  const restaurants = useMemo(() => {
    return reservationData.restaurants as Restaurant[];
  }, []);
  
  // Get filtered reservations based on selected restaurant
  const filteredReservations = useMemo(() => {
    const allReservations = reservationData.reservations as Reservation[];
    if (!selectedRestaurant) return allReservations;
    
    return allReservations.filter(
      reservation => reservation.restaurant_id === selectedRestaurant
    );
  }, [selectedRestaurant]);
  
  // Get selected restaurant details (for time slot configuration)
  const selectedRestaurantDetails = useMemo(() => {
    if (!selectedRestaurant) return null;
    return restaurants.find(r => r.id === selectedRestaurant);
  }, [selectedRestaurant, restaurants]);
  
  // Transform reservation data into calendar events
  const calendarEvents = useMemo(() => {
    return filteredReservations.map((reservation) => {
      // Extract user info based on user_id
      const user = reservationData.users.find(user => user.id === reservation.user_id);
      const userName = user ? user.name : 'Unknown';
      
      // Find restaurant info
      const restaurant = restaurants.find(r => r.id === reservation.restaurant_id);
      const restaurantName = restaurant ? restaurant.name : 'Unknown Restaurant';
      
      return {
        id: reservation.reservation_id,
        title: `${userName}`,
        description: `Guests: ${reservation.guest_count} - ${reservation.status}`,
        start: `${reservation.reservation_date} ${reservation.start_time.slice(0, 5)}`,
        end: `${reservation.reservation_date} ${reservation.end_time.slice(0, 5)}`,
        calendarId: 'reservations',
        location: `${restaurantName} - Table ${reservation.table_id}`,
        // Add all data to be available for popover
        data: {
          ...reservation,
          userName,
          restaurantName,
          userPhone: user?.phone_number || 'N/A',
          userEmail: user?.email || 'N/A'
        }
      };
    });
  }, [filteredReservations, restaurants]);
  
  // Get time range for the day view based on restaurant hours
  const dayBoundary = useMemo(() => {
    if (!selectedRestaurantDetails) {
      return { start: "07:00", end: "22:00" }; // Default range
    }
    
    // Use selected restaurant's operating hours
    return {
      start: selectedRestaurantDetails.start_time.slice(0, 5),
      end: selectedRestaurantDetails.end_time.slice(0, 5),
    };
  }, [selectedRestaurantDetails]);
  
  const calendarApp = useNextCalendarApp({
    views: [
      createViewWeek(),
      createViewDay(),
      createViewMonthAgenda(),
      createViewMonthGrid(),
    ],
    theme: 'shadcn',
    calendars: {
      reservations: {
        label: 'Reservations',
        colorName: 'reservations',
        lightColors: {
          main: 'hsl(210 40% 93.1%)',
          container: '#000',
          onContainer: 'hsl(210 40% 93.1%)',
        },
      },
    },
    selectedDate: new Date().toISOString().split('T')[0], // Today's date
    events: calendarEvents,
    dayBoundaries: dayBoundary,
    callbacks: {
      onEventClick: (event) => {
        // Show a popover with reservation details when an event is clicked
        const targetElement = document.querySelector(`[data-event-id="${event.id}"]`);
        if (targetElement) {
          const popover = document.createElement('div');
          popover.className = 'event-popover';
          popover.style.position = 'absolute';
          popover.style.zIndex = '1000';
          popover.style.backgroundColor = 'white';
          popover.style.border = '1px solid #e2e8f0';
          popover.style.borderRadius = '0.375rem';
          popover.style.padding = '1rem';
          popover.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
          popover.style.width = '320px';
          
          // Get position of event
          const rect = targetElement.getBoundingClientRect();
          const calendarRect = calendarRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
          
          popover.style.left = `${rect.right - calendarRect.left + 10}px`;
          popover.style.top = `${rect.top - calendarRect.top}px`;
          
          // Create popover content
          const content = document.createElement('div');
          content.className = 'space-y-3';
          
          const header = document.createElement('div');
          header.className = 'flex items-center justify-between';
          
          const title = document.createElement('h4');
          title.className = 'font-medium text-sm';
          title.textContent = event.title;
          
          const badge = document.createElement('span');
          badge.className = `inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
            event.data.status === 'Confirmed' ? 'bg-primary text-primary-foreground' :
            event.data.status === 'Pending' ? 'bg-secondary text-secondary-foreground' :
            'border-transparent text-foreground'
          }`;
          badge.textContent = event.data.status;
          
          header.appendChild(title);
          header.appendChild(badge);
          content.appendChild(header);
          
          // Add details
          const details = document.createElement('div');
          details.className = 'grid gap-1.5 text-sm';
          
          const detailItems = [
            { label: 'Restaurant', value: event.data.restaurantName || 'Unknown' },
            { label: 'Table', value: event.data.table_id || 'Unknown' },
            { label: 'Guests', value: event.data.guest_count || 'Unknown' },
            { label: 'Date', value: event.data.reservation_date || 'Unknown' },
            { label: 'Time', value: `${event.data.start_time?.slice(0, 5) || 'Unknown'} - ${event.data.end_time?.slice(0, 5) || 'Unknown'}` },
            { label: 'Contact', value: event.data.userPhone || 'Unknown' },
            { label: 'Email', value: event.data.userEmail || 'Unknown' }
          ];
          
          detailItems.forEach(item => {
            const row = document.createElement('div');
            row.className = 'flex justify-between';
            
            const label = document.createElement('span');
            label.className = 'text-muted-foreground';
            label.textContent = item.label + ':';
            
            const value = document.createElement('span');
            value.textContent = item.value;
            
            row.appendChild(label);
            row.appendChild(value);
            details.appendChild(row);
          });
          
          // Add notes if present
          if (event.data.notes) {
            const notesContainer = document.createElement('div');
            notesContainer.className = 'border-t pt-2 mt-2';
            
            const notesLabel = document.createElement('span');
            notesLabel.className = 'text-muted-foreground';
            notesLabel.textContent = 'Notes:';
            
            const notes = document.createElement('p');
            notes.className = 'mt-1';
            notes.textContent = event.data.notes || '';
            
            notesContainer.appendChild(notesLabel);
            notesContainer.appendChild(notes);
            details.appendChild(notesContainer);
          }
          
          content.appendChild(details);
          popover.appendChild(content);
          
          // Add close button
          const closeButton = document.createElement('button');
          closeButton.textContent = '×';
          closeButton.style.position = 'absolute';
          closeButton.style.top = '0.5rem';
          closeButton.style.right = '0.5rem';
          closeButton.style.fontSize = '1.25rem';
          closeButton.style.cursor = 'pointer';
          closeButton.onclick = () => {
            document.body.removeChild(popover);
          };
          
          popover.appendChild(closeButton);
          
          // Add click outside handler
          const handleClickOutside = (e: MouseEvent) => {
            if (!popover.contains(e.target as Node)) {
              document.body.removeChild(popover);
              document.removeEventListener('click', handleClickOutside);
            }
          };
          
          // Add to DOM and set up event listener
          document.body.appendChild(popover);
          setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
          }, 100);
        }
      }
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Select 
          onValueChange={(value) => setSelectedRestaurant(value === "all" ? null : Number(value))}
          defaultValue="all"
        >
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue placeholder="Select Restaurant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Restaurants</SelectItem>
            {restaurants.map((restaurant) => (
              <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
                {restaurant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div ref={calendarRef}>
        <ScheduleXCalendar calendarApp={calendarApp} />
      </div>
    </div>
  );
}