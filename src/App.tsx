import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { LogPage } from "@/pages/LogPage";
import { LibraryPage } from "@/pages/LibraryPage";
import { GoalsPage } from "@/pages/GoalsPage";

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/log" element={<LogPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/add" element={<Navigate to="/library" replace />} />
        <Route path="/foods" element={<Navigate to="/library" replace />} />
        <Route path="/goals" element={<GoalsPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
