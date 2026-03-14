"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, GraduationCap, CalendarDays, CreditCard, ClipboardList, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { api, type DashboardData } from "@/lib/api";

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const ACTION_LABELS: Record<string, string> = {
  create: "Tạo mới",
  update: "Cập nhật",
  delete: "Xoá",
  register: "Đăng ký",
  unregister: "Huỷ đăng ký",
  use_session: "Dùng buổi",
  attendance: "Điểm danh",
};
const ENTITY_COLORS: Record<string, string> = {
  parent: "bg-blue-100 text-blue-700",
  student: "bg-purple-100 text-purple-700",
  class: "bg-amber-100 text-amber-700",
  subscription: "bg-emerald-100 text-emerald-700",
  registration: "bg-pink-100 text-pink-700",
  attendance: "bg-cyan-100 text-cyan-700",
};

const formatPrice = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await api.dashboard();
      setData(d);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground">Không tải được dữ liệu.</p>;

  const { stats, subsByPackage, classesByDay, revenueByMonth, recentActivities } = data;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Tổng quan hệ thống TeenCare – Mini LMS" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard title="Phụ huynh" value={stats.totalParents} icon={Users} />
        <StatCard title="Học sinh" value={stats.totalStudents} icon={GraduationCap} />
        <StatCard title="Lớp học" value={stats.totalClasses} icon={CalendarDays} />
        <StatCard title="Đăng ký lớp" value={stats.totalRegistrations} icon={ClipboardList} />
        <StatCard
          title="Gói còn hiệu lực"
          value={stats.activeSubs}
          icon={CreditCard}
          description={`${stats.expiredSubs} đã hết hạn`}
        />
        <StatCard
          title="Doanh thu tháng gần nhất"
          value={revenueByMonth.length > 0 ? formatPrice(revenueByMonth[0].total) : "0 ₫"}
          icon={TrendingUp}
          description={revenueByMonth.length > 0 ? `${revenueByMonth[0].count} gói đăng ký` : ""}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Subscriptions by package */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Gói đăng ký theo loại</CardTitle>
          </CardHeader>
          <CardContent>
            {subsByPackage.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-3">
                {subsByPackage.map((item) => {
                  const max = Math.max(...subsByPackage.map((i) => i.count));
                  const pct = max > 0 ? (item.count / max) * 100 : 0;
                  return (
                    <div key={item._id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{item._id}</span>
                        <span className="text-muted-foreground">{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Classes by day */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lớp học theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2" style={{ height: 120 }}>
              {Array.from({ length: 7 }, (_, i) => {
                const item = classesByDay.find((d) => d._id === i);
                const count = item?.count || 0;
                const max = Math.max(...classesByDay.map((d) => d.count), 1);
                const h = max > 0 ? (count / max) * 90 : 0;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-medium">{count}</span>
                    <div
                      className="w-full rounded-t bg-primary/80 transition-all"
                      style={{ height: `${h}px` }}
                    />
                    <span className="text-xs text-muted-foreground">{DAY_LABELS[i]}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có hoạt động nào</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((a) => (
                <div key={a._id} className="flex items-start gap-3 text-sm">
                  <Badge variant="secondary" className={ENTITY_COLORS[a.entity] || ""}>
                    {ACTION_LABELS[a.action] || a.action}
                  </Badge>
                  <div className="flex-1">
                    <p>{a.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
