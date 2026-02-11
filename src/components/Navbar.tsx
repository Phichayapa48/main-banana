import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Book, Store, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NavLink } from "./NavLink"; 

const Navbar = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("ออกจากระบบเรียบร้อย");
    navigate("/");
  };

  return (
    <nav className="border-b border-yellow-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1
            className="text-2xl font-black tracking-tight bg-gradient-to-r from-yellow-500 to-yellow-700 bg-clip-text text-transparent cursor-pointer"
            onClick={() => navigate("/")}
          >
            Banana Expert
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* ✨ NavLink: ใช้สีเหลืองเข้ม (Yellow-600) เมื่อ Active เพื่อให้อ่านออกชัดเจน */}
          <NavLink 
            to="/knowledge" 
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-500 transition-all hover:text-yellow-600 hover:bg-yellow-50"
            activeClassName="bg-yellow-100 text-yellow-700 shadow-sm border border-yellow-200" 
          >
            <Book className="w-4 h-4" />
            Knowledge
          </NavLink>

          <NavLink 
            to="/market" 
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-500 transition-all hover:text-yellow-600 hover:bg-yellow-50"
            activeClassName="bg-yellow-100 text-yellow-700 shadow-sm border border-yellow-200"
          >
            <Store className="w-4 h-4" />
            Marketplace
          </NavLink>

          {/* ส่วนเช็คสถานะ Login */}
          {session ? (
            <div className="flex items-center gap-2 border-l border-yellow-100 pl-4 ml-2">
              {/* ✨ ปุ่ม Profile: ใช้สีเหลืองทอง ตัดกับตัวหนังสือเข้ม อ่านง่ายชัวร์ */}
              <Button 
                variant="outline" 
                onClick={() => navigate("/dashboard")} 
                className="gap-2 rounded-xl border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 font-bold shadow-sm"
              >
                <User className="w-4 h-4" /> Profile
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut} 
                className="rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => navigate("/auth/login")}
              className="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-black rounded-xl px-6 shadow-md transition-all active:scale-95"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
