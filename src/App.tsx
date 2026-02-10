import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Knowledge from "./pages/Knowledge";
import CultivarDetail from "./pages/CultivarDetail";
import Market from "./pages/Market";
import Dashboard from "./pages/Dashboard";
import ProductDetail from "./pages/ProductDetail";
import UpdateProfile from "./pages/UpdateProfile";
import NotFound from "./pages/NotFound";
import UserOrders from "./pages/UserOrders";
import FarmReviews from "@/pages/FarmReviews";

// Farm Pages
import FarmDashboard from "./pages/farm/FarmDashboard";
import AddProduct from "./pages/farm/AddProduct";
import EditProduct from "./pages/farm/EditProduct"; // ✨ เพิ่ม Import หน้าแก้ไขสินค้า
import ManageProducts from "./pages/farm/ManageProducts";
import FarmOrders from "./pages/farm/FarmOrders";
import OrderDetail from "./pages/farm/OrderDetail";
import FarmPublic from "@/pages/farm/FarmPublic";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 🏠 Main Route */}
          <Route path="/" element={<Index />} />
          <Route path="/auth/login" element={<Auth />} />
          
          {/* 📖 Knowledge & Cultivar (เชื่อมจากหน้า Index และ Knowledge) */}
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/knowledge/:slug" element={<CultivarDetail />} />
          <Route path="/cultivar/:slug" element={<CultivarDetail />} /> {/* ✨ ทางด่วนเชื่อมจากปุ่มในหน้า Index ใหม่ */}
          
          {/* 🛒 Market & Products (เชื่อมจากปุ่ม "แนะนำฟาร์ม" ในหน้า Index) */}
          <Route path="/market" element={<Market />} />
          <Route path="/market/product/:id" element={<ProductDetail />} />
          
          {/* 👤 User & Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/orders" element={<UserOrders />} /> {/* ✨ กลับมาแล้ว! */}
          <Route path="/profile" element={<UpdateProfile />} />
          
          {/* 🚜 Farm Management (ระบบหลังบ้านฟาร์ม) */}
          <Route path="/farm/dashboard" element={<FarmDashboard />} />
          <Route path="/farm/products" element={<ManageProducts />} />
          <Route path="/farm/products/add" element={<AddProduct />} />
          <Route path="/farm/products/edit/:id" element={<EditProduct />} /> {/* ✨ เพิ่ม Route สำหรับแก้ไขสินค้า */}
          <Route path="/farm/orders" element={<FarmOrders />} />
          <Route path="/farm/orders/:id" element={<OrderDetail />} />

          {/* 🏠 Farm Public Profile (เชื่อมจากชื่อฟาร์มในหน้า Market) */}
          <Route path="/farm/:farmId" element={<FarmPublic />} /> {/* ✨ กลับมาแล้ว! */}
          <Route path="/farm/reviews/:farmId" element={<FarmReviews />} /> {/* ✨ กลับมาแล้ว! */}

          {/* ❌ Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;