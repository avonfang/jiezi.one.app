import { NextRequest } from "next/server";
import { kvGet } from "@/lib/kv-store";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId");
  if (!orderId || !/^[0-9a-zA-Z_-]{12,20}$/.test(orderId)) {
    return Response.json({ error: "参数错误" }, { status: 400 });
  }

  try {
    const order = await kvGet<any>(`order:${orderId}`);
    if (!order) {
      return Response.json({ error: "订单不存在" }, { status: 404 });
    }

    return Response.json({
      success: true,
      status: order.status,
      confirmed: order.status === "confirmed",
      plan: order.plan,
      credits: order.credits,
    });
  } catch {
    return Response.json({ error: "查询失败" }, { status: 500 });
  }
}
