"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/dashboard/page-header";
import { CreditCard, Zap } from "lucide-react";
import { api, type Pkg, type Sub } from "@/lib/api";

type StudentOption = { _id: string; name: string };

const formatPrice = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function SubscriptionsPage() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [list, setList] = useState<Sub[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [usingId, setUsingId] = useState<string | null>(null);
  const [registerDialog, setRegisterDialog] = useState<Pkg | null>(null);
  const [registerStudentId, setRegisterStudentId] = useState("");
  const [registerStart, setRegisterStart] = useState("");
  const [registerEnd, setRegisterEnd] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const loadPackages = useCallback(async () => {
    try { setPackages(await api.packages.list()); } catch { setPackages([]); }
  }, []);

  const loadList = useCallback(async () => {
    try {
      const data = await api.subscriptions.list();
      setList(data.items);
    } catch { setList([]); }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      const data = await api.students.list();
      setStudents(data.items.map((s) => ({ _id: s._id, name: s.name })));
    } catch { setStudents([]); }
  }, []);

  useEffect(() => { loadPackages(); }, [loadPackages]);
  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { loadStudents(); }, [loadStudents]);

  const openRegister = (pkg: Pkg) => {
    setRegisterDialog(pkg);
    setRegisterStudentId(students[0]?._id ?? "");
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    setRegisterStart(start.toISOString().slice(0, 10));
    setRegisterEnd(end.toISOString().slice(0, 10));
    setRegisterError("");
  };

  const onRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerDialog || !registerStudentId || !registerStart || !registerEnd) return;
    setRegisterError(""); setRegisterLoading(true);
    try {
      await api.subscriptions.create({
        student_id: registerStudentId,
        package_key: registerDialog.key,
        start_date: registerStart,
        end_date: registerEnd,
      });
      setRegisterDialog(null);
      await loadList();
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleUse = async (id: string) => {
    setUsingId(id);
    try {
      await api.subscriptions.use(id);
      await loadList();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setUsingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Gói học" description="Quản lý các gói đăng ký" />

      {/* Package cards */}
      <section>
        <h2 className="mb-4 text-lg font-medium">Chọn gói đăng ký</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg._id} className={`relative ${pkg.isPopular ? "border-primary border-2" : ""}`}>
              {pkg.isPopular && (
                <Badge className="absolute  right-4 bg-primary text-primary-foreground">
                  Phổ biến nhất
                </Badge>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{pkg.name}</CardTitle>
                <p className="text-xl font-bold">{formatPrice(pkg.price)}<span className="text-sm font-normal text-muted-foreground"> /tháng</span></p>
                {pkg.originalPrice != null && pkg.originalPrice > pkg.price && (
                  <p className="text-sm text-muted-foreground line-through">{formatPrice(pkg.originalPrice)}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {pkg.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Zap className="mt-0.5 h-3.5 w-3.5 text-primary shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={pkg.isPopular ? "default" : "outline"} onClick={() => openRegister(pkg)}>
                  Đăng ký ngay
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Register dialog */}
      <Dialog open={!!registerDialog} onOpenChange={(open) => !open && setRegisterDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đăng ký: {registerDialog?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onRegisterSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label>Học sinh</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={registerStudentId}
                onChange={(e) => setRegisterStudentId(e.target.value)}
                required
              >
                {students.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>
                <input
                  type="date"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={registerStart}
                  onChange={(e) => setRegisterStart(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày kết thúc</Label>
                <input
                  type="date"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={registerEnd}
                  onChange={(e) => setRegisterEnd(e.target.value)}
                  required
                />
              </div>
            </div>
            {registerError && <p className="text-sm text-destructive">{registerError}</p>}
            <Button type="submit" disabled={registerLoading}>
              {registerLoading ? "Đang xử lý..." : "Xác nhận đăng ký"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Existing subscriptions */}
      <section>
        <h2 className="mb-4 text-lg font-medium">Gói đã đăng ký</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học sinh</TableHead>
                  <TableHead>Gói</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Buổi</TableHead>
                  <TableHead>Hạn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((s) => {
                  const isExpired = new Date(s.endDate) < new Date();
                  const unlimited = s.totalSessions === 0;
                  const remaining = s.totalSessions - s.usedSessions;
                  return (
                    <TableRow key={s._id}>
                      <TableCell className="font-medium">{s.studentId?.name || "-"}</TableCell>
                      <TableCell>{s.packageName}</TableCell>
                      <TableCell>{s.price != null ? formatPrice(s.price) : "-"}</TableCell>
                      <TableCell>
                        {unlimited ? (
                          <Badge variant="secondary">Không giới hạn</Badge>
                        ) : (
                          `${s.usedSessions}/${s.totalSessions}`
                        )}
                      </TableCell>
                      <TableCell>{new Date(s.endDate).toLocaleDateString("vi-VN")}</TableCell>
                      <TableCell>
                        {isExpired ? (
                          <Badge variant="destructive">Hết hạn</Badge>
                        ) : remaining <= 0 && !unlimited ? (
                          <Badge variant="destructive">Hết buổi</Badge>
                        ) : (
                          <Badge variant="default">Hoạt động</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!unlimited && remaining > 0 && !isExpired && (
                          <Button size="sm" variant="outline" disabled={usingId === s._id} onClick={() => handleUse(s._id)}>
                            <CreditCard className="mr-1 h-3.5 w-3.5" />
                            {usingId === s._id ? "..." : "Dùng 1 buổi"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Chưa có gói đăng ký nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
