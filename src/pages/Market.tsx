import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; 
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, MapPin, X } from "lucide-react"; 
import { toast } from "sonner";
import Navbar from "@/components/Navbar"; // ✅ ใช้ Navbar ตัวหลักของแอป
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ---------- Types ---------- */
interface FarmProfile {
  farm_name: string;
  farm_location: string;
  rating: number | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  product_type: string; 
  price_per_unit: number;
  available_quantity: number;
  unit: string;
  harvest_date: string;
  image_url: string | null;
  farm_id: string;
  farm: FarmProfile | null;
}

/* ---------- Component ---------- */
const Market = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState(initialSearch);
  const [typeFilter, setTypeFilter] = useState<"all" | "fruit" | "shoot">("all");

  const translateType = (type: string) => {
    const types: Record<string, string> = {
      fruit: "ผล",
      shoot: "หน่อ",
      "ผล": "ผล",
      "หน่อ": "หน่อ"
    };
    return types[type] || type;
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          product_type,
          price_per_unit,
          available_quantity,
          unit,
          harvest_date,
          image_url,
          farm_id,
          farm: farm_profiles (
            farm_name,
            farm_location,
            rating
          )
        `)
        .eq("is_active", true);

      if (error) throw error;
      setProducts(data ?? []);
    } catch (err) {
      console.error(err);
      toast.error("โหลดสินค้าไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const keyword = search.toLowerCase();
    const matchName = p.name.toLowerCase().includes(keyword);
    const matchFarm = p.farm?.farm_name.toLowerCase().includes(keyword) ?? false;
    const matchType = typeFilter === "all" || p.product_type === typeFilter;
    return (matchName || matchFarm) && matchType;
  });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ✅ Navbar ตัวกลางที่เชื่อมต่อระบบ Login/Profile แล้ว */}
      <Navbar />

      <div className="container mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-3 text-foreground">ค้นหาผลผลิตกล้วยจากฟาร์ม</h2>
          <p className="text-muted-foreground text-lg">เชื่อมต่อการจองผลผลิตกล้วยกับฟาร์มโดยตรงทั่วประเทศไทย</p>
        </div>

        {/* Filters */}
        <div className="max-w-4xl mx-auto mb-8 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="ค้นหาสินค้าหรือฟาร์ม..."
              value={search}
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-10 pr-10 bg-background"
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <Select
            value={typeFilter}
            onValueChange={(v: "all" | "fruit" | "shoot") => setTypeFilter(v)}
          >
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="fruit">ผลกล้วย</SelectItem>
              <SelectItem value="shoot">หน่อกล้วย</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">กำลังโหลดสินค้า...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-background rounded-xl border border-dashed">
            ไม่พบสินค้าที่คุณกำลังมองหา
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <Card
                key={p.id}
                className="group cursor-pointer hover:shadow-md transition-all duration-300 border-none bg-background overflow-hidden"
                onClick={() => navigate(`/market/product/${p.id}`)}
              >
                {/* Image Section */}
                <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                   {p.image_url ? (
                     <img 
                       src={p.image_url} 
                       alt={p.name} 
                       className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                     />
                   ) : (
                     <span className="text-5xl group-hover:scale-110 transition-transform">🍌</span>
                   )}
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{p.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span
                          className="hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/farm/${p.farm_id}`);
                          }}
                        >
                          {p.farm?.farm_name ?? "ไม่ระบุชื่อฟาร์ม"}
                        </span>
                      </div>
                    </div>

                    {p.farm?.rating != null && (
                      <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded shadow-sm">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                        <span className="text-sm font-bold text-primary">
                          {p.farm.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                    {p.description || "ผลผลิตคุณภาพสดใหม่จากเกษตรกร"}
                  </p>

                  <div className="flex justify-between items-end border-t pt-4">
                    <div>
                      <p className="text-xl font-bold text-primary">
                        ฿{p.price_per_unit.toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground ml-1">/{p.unit}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                        คงเหลือ {p.available_quantity} {p.unit}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-muted font-bold text-muted-foreground uppercase">
                      {translateType(p.product_type)}
                    </span>
                  </div>

                  <p className="text-[10px] text-muted-foreground mt-3 text-right italic">
                    วันที่เก็บเกี่ยว: {new Date(p.harvest_date).toLocaleDateString('th-TH')}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Market;
