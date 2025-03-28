// EventCalendar.tsx
'use client';
import {ScheduleXCalendar, useNextCalendarApp} from "@schedule-x/react";
import {createViewDay, createViewMonthAgenda, createViewMonthGrid, createViewWeek} from "@schedule-x/calendar";
import '@schedule-x/theme-shadcn/dist/index.css';
export default function EventCalendar() {
  const calendarApp = useNextCalendarApp({
    views: [
      createViewWeek(),
      createViewDay(),
      createViewMonthAgenda(),
      createViewMonthGrid(),
    ],
    theme: 'shadcn',
    calendars: {
      johndoe: {
        label: 'John Doe',
        colorName: 'johndoe',
        lightColors: {
          main: 'hsl(210 40% 93.1%)',
          container: '#000',
          onContainer: 'hsl(210 40% 93.1%)',
        },
      },
    },
    selectedDate: '2023-12-01',
    events: [
      {
        id: 1,
        title: 'Coffee with John',
        start: '2023-12-01',
        end: '2023-12-01',
        calendarId: 'johndoe'
      },
      {
        id: 2,
        title: 'Breakfast with Sam',
        description: 'Discuss the new project',
        location: 'Starbucks',
        start: '2023-11-29 05:00',
        end: '2023-11-29 06:00',
        calendarId: 'johndoe'
      },
      {
        id: 3,
        title: 'Gym',
        start: '2023-11-27 06:00',
        end: '2023-11-27 07:00',
        calendarId: 'johndoe'
      },
      {
        id: 4,
        title: 'Media fasting',
        start: '2023-12-01',
        end: '2023-12-03',
        calendarId: 'johndoe'
      },
      {
        id: 5,
        title: 'Some appointment',
        people: ['John'],
        start: '2023-12-03 03:00',
        end: '2023-12-03 04:30',
        calendarId: 'johndoe'
      },
    ]
  })

  return <>
    <ScheduleXCalendar calendarApp={calendarApp} />
  </>
}