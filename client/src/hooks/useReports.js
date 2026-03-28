import { useState, useEffect } from "react";
import { api } from "../utils/api";

export function useReports() {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    api.getReports()
      .then(setReports)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { reports, loading, error };
}

export function useReport(weekStart) {
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!weekStart) return;
    setLoading(true);
    api.getReport(weekStart)
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [weekStart]);

  return { report, loading, error };
}
