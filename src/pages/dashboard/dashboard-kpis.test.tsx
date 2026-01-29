import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardKPIs from "./dashboard-kpis";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the API hooks
vi.mock("@/lib/react-query/dashboard-analytics-query", () => ({
  useDashboardKPIs: () => ({ data: { data: {} }, isLoading: false, refetch: vi.fn() }),
  useRevenueByMetal: () => ({ data: [], isLoading: false }),
  usePerformanceByItem: () => ({ data: [], isLoading: false }),
  useDiscountEfficiency: () => ({ data: {}, isLoading: false }),
  useInventoryHealth: () => ({ data: {}, isLoading: false }),
  useOrderFunnel: () => ({ data: [], isLoading: false }),
}));

// Mock Recharts to avoid issues in JSDOM
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
}));

const queryClient = new QueryClient();

describe("DashboardKPIs", () => {
  it("renders the dashboard headers", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardKPIs />
      </QueryClientProvider>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
    expect(screen.getByText("Revenue by Metal Type")).toBeInTheDocument();
  });
});
