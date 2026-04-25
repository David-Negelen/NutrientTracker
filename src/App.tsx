import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { LogPage } from "@/pages/LogPage";
import { AddFoodPage } from "@/pages/AddFoodPage";
import { GoalsPage } from "@/pages/GoalsPage";

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/log" element={<LogPage />} />
        <Route path="/add" element={<AddFoodPage />} />
        <Route path="/goals" element={<GoalsPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;