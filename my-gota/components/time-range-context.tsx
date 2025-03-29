"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

type TimeRange = '7d' | '30d' | '90d'

interface TimeRangeContextType {
  timeRange: TimeRange
  setTimeRange: (range: TimeRange) => void
  getTimeRangeText: () => string
}

const TimeRangeContext = createContext<TimeRangeContextType | undefined>(undefined)

export function TimeRangeProvider({ children }: { children: ReactNode }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('90d')

  const getTimeRangeText = () => {
    switch(timeRange) {
      case "7d":
        return "Last 7 days"
      case "30d":
        return "Last 30 days"
      case "90d":
      default:
        return "Last 3 months"
    }
  }

  return (
    <TimeRangeContext.Provider value={{ timeRange, setTimeRange, getTimeRangeText }}>
      {children}
    </TimeRangeContext.Provider>
  )
}

export function useTimeRange() {
  const context = useContext(TimeRangeContext)
  if (context === undefined) {
    throw new Error('useTimeRange must be used within a TimeRangeProvider')
  }
  return context
} 