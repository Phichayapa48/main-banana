import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Book, Store, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NavLink } from "./NavLink"; // ✨ ดึงตัวที่พี่ส่งมาให้ใช้

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
    <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1
            className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent cursor-pointer"
            onClick={() => navigate("/")}
          >
            Banana Expert
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* ✨ ใช้ NavLink ที่พี่ให้มา เพื่อให้มันขึ้นสีเหลืองเวลา active */}
          <NavLink 
            to="/knowledge" 
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent"
            activeClassName="text-primary bg-primary/10" 
          >
            <Book className="w-4 h-4" />
            Knowledge
          </NavLink>

          <NavLink 
            to="/market" 
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent"
            activeClassName="text-primary bg-primary/10"
          >
            <Store className="w-4 h-4" />
            Marketplace
          </NavLink>

          {/* ส่วนเช็คสถานะ Login */}
          {session ? (
            <div className="flex items-center gap-2 border-l pl-4 ml-2">
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="gap-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50">
                <User className="w-4 h-4" /> Profile
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-destructive hover:bg-destructive/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => navigate("/auth/login")}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
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
