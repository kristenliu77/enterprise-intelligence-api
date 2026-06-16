import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import Dashboard from "../pages/Dashboard/Dashboard";
import DataManagement from "../pages/DataManagement/DataManagement";
import Entities from "../pages/Entities/Entities";
import HeatCalculation from "../pages/HeatCalculation/HeatCalculation";
import IndustryRegion from "../pages/IndustryRegion/IndustryRegion";
import Login from "../pages/Login/Login";
import Matching from "../pages/Matching/Matching";
import PoliciesReports from "../pages/PoliciesReports/PoliciesReports";
import Settings from "../pages/Settings/Settings";
import Workbench from "../pages/Workbench/Workbench";
import { useAppStore } from "../store/appStore";

function ProtectedRoute(): JSX.Element {
  const user = useAppStore((state) => state.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout />;
}

export default function AppRouter(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/heat-calculation" element={<HeatCalculation />} />
        <Route path="/industry-region" element={<IndustryRegion />} />
        <Route path="/entities" element={<Entities />} />
        <Route path="/matching" element={<Matching />} />
        <Route path="/policies-reports" element={<PoliciesReports />} />
        <Route path="/workbench" element={<Workbench />} />
        <Route path="/data-management" element={<DataManagement />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
