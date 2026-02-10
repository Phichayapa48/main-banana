import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ---------- Types ---------- */

interface ShippingOrder {
  id: string;
  user_id: string;
  farm_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  shipped_at: string;
  carrier: string | null;
  tracking_number: string | null;

  products: {
  name: string;
  product_type: string;
  harvest_date: string;
  expiry_date: string | null;

  farm_profiles?: {
    farm_name: string;
  } | null;
};
}


interface ConfirmedOrder {
  id: string;
  quantity: number;
  created_at: string;

  products: {
    name: string;
    product_type: string;
    harvest_date: string | null;
    expiry_date: string | null;

    farm_profiles?: {
      farm_name: string;
    } | null;
  };
}


interface Reservation {
  id: string;
  quantity: number;
  created_at: string;

  products: {
    name: string;
    product_type: string;
    harvest_date: string;
    expiry_date: string | null;

    farm_profiles?: {
      farm_name: string;
    } | null;
  };
}


interface ReviewedOrder {
  id: string;
  quantity: number;
  created_at: string;

  products: {
    name: string;
    product_type: string;

    farm_profiles?: {
      farm_name: string;
    } | null;
  };

  reviews: {
    rating: number;
    comment: string | null;
  } | null;
}


interface ToReviewOrder {
  id: string;
  user_id: string;
  farm_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  shipped_at: string | null;
  carrier: string | null;
  tracking_number: string | null;

  products: {
    name: string;
    product_type: string;

    farm_profiles?: {
      farm_name: string;
    } | null;
  };
}





/* ---------- Component ---------- */

const UserOrders = () => {
  const navigate = useNavigate();

  const [shipping, setShipping] = useState<ShippingOrder[]>([]);
  const [confirmed, setConfirmed] = useState<ConfirmedOrder[]>([]);
  const [pending, setPending] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  /* REVIEW */
  const [openReview, setOpenReview] = useState(false);
  const [selectedOrder, setSelectedOrder] =
    useState<ShippingOrder | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("th-TH") : "-";
  const [history, setHistory] = useState<ReviewedOrder[]>([]);
  const [toReview, setToReview] = useState<ToReviewOrder[]>([]);
  const [tab, setTab] = useState("pending");




  /* ---------- LOAD DATA ---------- */

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [shippingRes, confirmedRes, pendingRes, toReviewRes, historyRes] = await Promise.all([
        supabase
          .from("orders")
          .select(`
            id,
            user_id,
            farm_id,
            product_id,
            quantity,
            created_at,
            shipped_at,
            carrier,
            tracking_number,
            products (
              name,
              product_type,
              harvest_date,
              expiry_date,
              farm_profiles (
                farm_name
              )
            )

          `)
          .eq("user_id", user.id)
          .eq("status", "shipped")
          .order("shipped_at", { ascending: false }),


        supabase
          .from("orders")
          .select(`
            id,
            quantity,
            created_at,
            products (
              name,
              product_type,
              harvest_date,
              expiry_date,
              farm_profiles (
                farm_name
              )
            )
          `)

          .eq("user_id", user.id)
          .eq("status", "confirmed")
          .order("confirmed_at", { ascending: false }),

        supabase
          .from("reservations")
          .select(`
            id,
            quantity,
            created_at,
            products (
              name,
              product_type,
              harvest_date,
              expiry_date,
              farm_profiles (
                farm_name
              )
            )

          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        
          supabase
            .from("orders")
            .select(`
              id,
              quantity,
              created_at,
              product_id,
              farm_id,
              user_id,
              shipped_at,
              carrier,
              tracking_number,
              products (
                name,
                product_type,
                farm_profiles (
                  id,
                  farm_name
                )
              )
            `)
            .eq("user_id", user.id)
            .eq("status", "delivered"),

          supabase
            .from("orders")
            .select(`
              id,
              quantity,
              created_at,
              products (
                name,
                product_type,
                farm_profiles (
                  farm_name
                    )
              ),
              reviews (
                rating,
                comment
              )
            `)
            .eq("user_id", user.id)
            .eq("status", "reviewed")


      ]);

      setShipping(shippingRes.data || []);
      setConfirmed(confirmedRes.data || []);
      setPending(pendingRes.data || []);
      setToReview(toReviewRes.data || []);
      setHistory(historyRes.data || []);
    } catch {
      toast.error("โหลดออเดอร์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- CONFIRM RECEIVED ---------- */

  const confirmReceived = async (order: ShippingOrder) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (error) throw error;

      toast.success("ยืนยันรับสินค้าแล้ว");

      setSelectedOrder(order);
      setOpenReview(true);

      setShipping((prev) => prev.filter((o) => o.id !== order.id));}
      catch {
      toast.error("ยืนยันรับสินค้าไม่ได้");
    }
  };

  const cancelReservation = async (reservationId: string) => {
  try {

    // ⭐ 1. ดึงข้อมูล reservation
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("product_id, quantity")
      .eq("id", reservationId)
      .single();

    if (fetchError) throw fetchError;

    // ⭐ 2. คืน stock ให้สินค้า
    const { error: stockError } = await supabase.rpc(
  "increase_product_quantity",
  {
    product_id_input: reservation.product_id,
    qty_input: reservation.quantity,
  }
);


    if (stockError) throw stockError;

    // ⭐ 3. ลบ reservation
    const { error: deleteError } = await supabase
      .from("reservations")
      .delete()
      .eq("id", reservationId);

    if (deleteError) throw deleteError;

    toast.success("ยกเลิกการจองแล้ว");

    await loadAll();

  } catch (e) {
    console.error(e);
    toast.error("ยกเลิกการจองไม่ได้");
  }
};




  /* ---------- SUBMIT REVIEW ---------- */

  const submitReview = async () => {
  if (!selectedOrder) return;

  if (!selectedOrder.farm_id) {
    toast.error("ไม่พบข้อมูลฟาร์มของออเดอร์นี้");
    return;
  }

    try {
      /* ป้องกันรีวิวซ้ำ */
      const { data: exist } = await supabase
        .from("reviews")
        .select("id")
        .eq("order_id", selectedOrder.id)
        .maybeSingle();

      if (exist) {
        toast.error("ออเดอร์นี้รีวิวแล้ว");
        return;
      }

      const { error } = await supabase.from("reviews").insert({
        order_id: selectedOrder.id,
        product_id: selectedOrder.product_id,
        farm_id: selectedOrder.farm_id,
        user_id: selectedOrder.user_id,
        rating,
        comment,
      });

      if (error) throw error;

      await supabase
        .from("orders")
        .update({ status: "reviewed" })
        .eq("id", selectedOrder.id);

      toast.success("ขอบคุณสำหรับรีวิว 🌟");

      setOpenReview(false);
      setSelectedOrder(null);
      setRating(5);
      setComment("");
      await loadAll();
    } catch (e: any) {
      console.error("Cancel reservation error:", e);
      toast.error(e.message || "ยกเลิกการจองไม่ได้");
    }

  };

  /* ---------- LOADING ---------- */

  if (loading)
    return <div className="p-10 text-center">Loading...</div>;

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-muted/30">
      {/* HEADER */}
      <nav className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold">การจองของฉัน</h1>
        </div>
      </nav>

      <div className="container mx-auto px-4 max-w-6xl space-y-6 py-6">
        {/* ---------- Tabs ---------- */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="shipping">กำลังจัดส่ง</TabsTrigger>
            <TabsTrigger value="confirmed">ฟาร์มยืนยันแล้ว</TabsTrigger>
            <TabsTrigger value="pending">รอยืนยัน</TabsTrigger>
            <TabsTrigger value="review">ยังไม่ได้รีวิว</TabsTrigger>
            <TabsTrigger value="history">ประวัติ</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ---------- SHIPPING ---------- */}
        {tab === "shipping" && (
          <Card className="p-6 space-y-4">
            {shipping.length === 0 && <p>ไม่มีรายการ</p>}

            {shipping.map((o) => (
              <div key={o.id} className="border rounded p-4 space-y-2">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">{o.products.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {o.products.product_type} • {o.quantity} ชิ้น
                    </p>
                    <p>ฟาร์ม : {o.products.farm_profiles?.farm_name || "-"}</p>
                  </div>
                  <Badge>Shipped</Badge>
                </div>

                <p>ขนส่ง : {o.carrier || "-"}</p>
                <p>หมายเลขพัสดุ : {o.tracking_number || "-"}</p>
                <p>วันที่จอง : {formatDate(o.created_at)}</p>        
                <p>ฟาร์มเก็บเกี่ยว : {formatDate(o.products?.harvest_date)}</p>
                <p>วันจัดส่ง : {formatDate(o.shipped_at)}</p>


                <Button onClick={() => confirmReceived(o)}>
                  ได้รับของแล้ว
                </Button>
              </div>
            ))}
          </Card>
        )}

        {/* ---------- CONFIRMED ---------- */}
        {tab === "confirmed" && (
          <Card className="p-6 space-y-4">
            {confirmed.length === 0 && <p>ไม่มีรายการ</p>}

            {confirmed.map((o) => (
              <div key={o.id} className="border rounded p-4">
                <p className="font-semibold">{o.products.name}</p>
                <p>{o.products.product_type} • {o.quantity}</p>
                <p>วันที่จอง : {formatDate(o.created_at)}</p>
                <p className="font-bold pt-2">เกี่ยวกับสินค้า</p>
                <p>ฟาร์ม : {o.products.farm_profiles?.farm_name || "-"}</p>
                <p>ฟาร์มเก็บเกี่ยว : {formatDate(o.products?.harvest_date)}</p>
                <p>วันที่ฟาร์มคาดว่าจะจัดส่ง : {formatDate(o.products?.expiry_date)}</p>

              </div>
            ))}
          </Card>
        )}

        {/* ---------- PENDING ---------- */}
        {tab === "pending" && (
          <Card className="p-6 space-y-4">
            {pending.length === 0 && <p>ไม่มีรายการ</p>}

            {pending.map((r) => (
              <div key={r.id} className="border rounded p-4">
                <p className="font-semibold">{r.products.name}</p>
                <p>{r.products.product_type} • {r.quantity} </p>
                <p>วันที่จอง : {formatDate(r.created_at)}</p>
                <p className="font-bold pt-2">เกี่ยวกับสินค้า</p>
                <p>ฟาร์ม : {r.products.farm_profiles?.farm_name || "-"}</p>
                <p>ฟาร์มเก็บเกี่ยว : {formatDate(r.products?.harvest_date)}</p>
                <p>วันที่ฟาร์มคาดว่าจะจัดส่ง : {formatDate(r.products?.expiry_date)}</p>

                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("ต้องการยกเลิกออเดอร์นี้หรือไม่ ?")) {
                      cancelReservation(r.id);
                    }
                  }}
                >
                  ยกเลิกออเดอร์
                </Button>


              </div>
            ))}
          </Card>
        )}

        {/* ---------- TO REVIEW ---------- */}
        {tab === "review" && (
          <Card className="p-6 space-y-4">
            {toReview.length === 0 && <p>ไม่มีรายการ</p>}

            {toReview.map((o) => (
              <div key={o.id} className="border rounded p-4 space-y-2">
                <p className="font-semibold">{o.products.name}</p>
                <p>{o.products.product_type} • {o.quantity} </p>
                <p>ฟาร์ม : {o.products.farm_profiles?.farm_name || "-"}</p>
                <p>ขนส่ง : {o.carrier || "-"}</p>
                <p>หมายเลขพัสดุ : {o.tracking_number || "-"}</p>
                <p>วันที่จอง : {formatDate(o.created_at)}</p> 
                <p>วันจัดส่ง : {formatDate(o.shipped_at)}</p>

                <Button
                  onClick={() => {
                    setSelectedOrder(o as ShippingOrder);
                    setOpenReview(true);
                  }}
                >
                  รีวิวสินค้า
                </Button>
              </div>
            ))}
          </Card>
        )}

        {/* ---------- HISTORY ---------- */}
        {tab === "history" && (
          <Card className="p-6 space-y-4">
            {history.length === 0 && <p>ไม่มีรายการ</p>}

            {history.map((o) => (
              <div key={o.id} className="border rounded p-4">
                <p className="font-semibold">{o.products.name}</p>
                <p>ฟาร์ม : {o.products.farm_profiles?.farm_name || "-"}</p>
                <p>วันที่จอง : {formatDate(o.created_at)}</p>     
                
                <p> ⭐ {o.reviews?.rating}/5</p>
                <p> รีวิว : {o.reviews?.comment}</p>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* REVIEW MODAL */}
      <Dialog open={openReview} onOpenChange={setOpenReview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              รีวิว {selectedOrder?.products?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Button
                  key={n}
                  variant={rating >= n ? "default" : "outline"}
                  onClick={() => setRating(n)}
                >
                  ⭐ {n}
                </Button>
              ))}
            </div>

            <Textarea
              placeholder="เขียนรีวิว..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <Button onClick={submitReview} className="w-full">
              ส่งรีวิว
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default UserOrders;