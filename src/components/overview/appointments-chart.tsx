"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { Appointment } from "@/types"
import { useMemo } from "react"
import { format, subMonths } from "date-fns"

interface AppointmentsChartProps {
  appointments: Appointment[];
}

const chartConfig = {
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-1))",
  },
  confirmed: {
    label: "Confirmed",
    color: "hsl(var(--chart-2))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-3))",
  },
  cancelled: {
    label: "Cancelled",
    color: "hsl(var(--chart-4))",
  },
  "no-show": {
    label: "No Show",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export default function AppointmentsChart({ appointments }: AppointmentsChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(now, 5 - i);
        return {
            month: format(date, 'MMMM'),
            completed: 0,
            confirmed: 0,
            pending: 0,
            cancelled: 0,
            "no-show": 0,
        };
    });

    const monthIndexMap = new Map(months.map((m, i) => [m.month, i]));

    appointments.forEach(apt => {
        if (!apt.createdAt?.toDate) return;

        try {
            const aptDate = apt.createdAt.toDate();
            if (aptDate >= sixMonthsAgo) {
                const monthName = format(aptDate, 'MMMM');
                const index = monthIndexMap.get(monthName);

                if (index !== undefined) {
                    if (apt.status === 'completed' || apt.status === 'confirmed' || apt.status === 'pending' || apt.status === 'cancelled' || apt.status === 'no-show') {
                        months[index][apt.status]++;
                    }
                }
            }
        } catch (e) {
            // Ignore errors from invalid dates
        }
    });

    return months;
  }, [appointments]);

  if (!appointments || appointments.length === 0) {
    return <div className="flex h-[350px] w-full items-center justify-center text-muted-foreground">Not enough data to display chart.</div>
  }

  return (
      <ChartContainer config={chartConfig} className="h-[350px] w-full">
        <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="confirmed" stackId="a" fill="var(--color-confirmed)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="pending" stackId="a" fill="var(--color-pending)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="cancelled" stackId="a" fill="var(--color-cancelled)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="no-show" stackId="a" fill="var(--color-no-show)" radius={[0, 0, 0, 0]} />
        </BarChart>
      </ChartContainer>
  )
}
