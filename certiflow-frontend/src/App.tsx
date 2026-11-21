import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import BatchesPage from "./pages/BatchesPage";
import CreateBatchPage from "./pages/CreateBatchPage";
import BatchDetailsPage from "./pages/BatchDetailsPage";
import ReviewPage from "./pages/ReviewPage";
import CertificatesPage from "./pages/CertificatesPage";

export default function App() {
  const { user } = useAuth();
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="batches" element={<BatchesPage />} />
        <Route path="batches/:batchId" element={<BatchDetailsPage />} />
        <Route element={<ProtectedRoute roles={["TRAINING_CENTRE"]} />}>
          <Route path="create-batch" element={<CreateBatchPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={["DISTRICT_OFFICER", "QUALITY_OFFICER", "STATE_OFFICER"]} />}>
          <Route path="review" element={<ReviewPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={["STATE_OFFICER"]} />}>
          <Route path="certificates" element={<CertificatesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
  </Routes>;
}
