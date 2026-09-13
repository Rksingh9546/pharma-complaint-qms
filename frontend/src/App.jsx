import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ComplaintDetailsPage from "./pages/ComplaintDetailsPage";
import ComplaintIntakePage from "./pages/ComplaintIntakePage";
import ComplaintListPage from "./pages/ComplaintListPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/complaints/new" replace />} />
        {/* Static route declared before /:id — v6 matches static segments first */}
        <Route path="/complaints/new" element={<ComplaintIntakePage />} />
        <Route path="/complaints" element={<ComplaintListPage />} />
        <Route path="/complaints/:id" element={<ComplaintDetailsPage />} />
        <Route path="*" element={<Navigate to="/complaints/new" replace />} />
      </Route>
    </Routes>
  );
}