import { Routes, Route } from "react-router-dom";
import Dashboard  from "./pages/Dashboard";
import WeekDetail from "./pages/WeekDetail";
import RunDetail  from "./pages/RunDetail";
import Trends     from "./pages/Trends";

export default function App() {
  return (
    <Routes>
      <Route path="/"                              element={<Dashboard />} />
      <Route path="/trends"                        element={<Trends />} />
      <Route path="/week/:weekStart"               element={<WeekDetail />} />
      <Route path="/week/:weekStart/run/:runId"    element={<RunDetail />} />
    </Routes>
  );
}
