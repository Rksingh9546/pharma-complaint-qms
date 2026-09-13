import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import ToastContainer from "../common/ToastContainer";

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
}