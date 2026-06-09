import type { Metadata } from "next";
import { DashboardScreen } from "./dashboard-screen";

export const metadata: Metadata = {
  title: "Dashboard — KinMatch",
  description: "Your friendship overview and connection insights",
};

export default function DashboardPage() {
  return <DashboardScreen />;
}
