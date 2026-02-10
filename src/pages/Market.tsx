import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; 
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Star, MapPin, X } from "lucide-react"; 
import { toast } from "sonner";
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

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1); 
    } else {
      navigate("/"); 
    }
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
      
      // ✨ แก้ไขจุดนี้: ปรับการดึงข้อมูล Relation ให้ดึงได้แม้ไม่ได้ Login 
      // (อย่าลืมเปิด RLS policy: Enable read access for all users ในตาราง farm_profiles บน Supabase ด้วยนะเคิ้ป)
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
      <nav className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            ย้อนกลับ
          </Button>
          <h1 className="text-xl font-bold">Banana Marketplace</h1>
          <Button onClick={() => navigate("/auth/login")}>เข้าสู่ระบบ</Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-3">ค้นหาผลผลิตกล้วยจากฟาร์ม</h2>
          <p className="text-muted-foreground">เชื่อมต่อการจองผลผลิตกล้วยกับฟาร์มโดยตรงทั่วประเทศไทย</p>
        </div>

        {/* Filters */}
        <div className="max-w-4xl mx-auto mb-8 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="ค้นหาสินค้าหรือฟาร์ม..."
              value={search}
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-10 pr-10"
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
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="fruit">ผล</SelectItem>
              <SelectItem value="shoot">หน่อ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">กำลังโหลดสินค้า...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">ไม่พบสินค้า</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <Card
                key={p.id}
                className="cursor-pointer hover:shadow-md transition"
                onClick={() => navigate(`/market/product/${p.id}`)}
              >
                <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                   {p.image_url ? (
                     <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-5xl">🍌</span>
                   )}
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{p.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span
                          className="hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/farm/${p.farm_id}`);
                          }}
                        >
                          {/* ตรงนี้จะดึงชื่อมาโชว์ได้ทันทีถ้าแก้สิทธิ์ใน Supabase แล้วครับ */}
                          {p.farm?.farm_name ?? "ไม่ระบุชื่อฟาร์ม"}
                        </span>
                      </div>
                    </div>

                    {p.farm?.rating != null && (
                      <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                        <span className="text-sm font-medium text-primary">
                          {p.farm.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {p.description || "ผลผลิตคุณภาพสดใหม่"}
                  </p>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xl font-bold text-primary">
                        ฿{p.price_per_unit.toLocaleString()}
                        <span className="text-sm text-muted-foreground">/{p.unit}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        มีสินค้าคงเหลือ {p.available_quantity} {p.unit}
                      </p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-muted font-medium">
                      {translateType(p.product_type)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-3">
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