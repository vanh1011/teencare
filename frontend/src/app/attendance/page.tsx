"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Plus, Search, CalendarDays } from "lucide-react";
import { api, type AttendanceRecord, type ClassItem, type Registration } from "@/lib/api";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  present: { label: "Có mặt", variant: "default" },
  absent: { label: "Vắng", variant: "destructive" },
  late: { label: "Trễ", variant: "outline" },
  excused: { label: "Có phép", variant: "secondary" },
};

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selClassId, setSelClassId] = useState("");
  const [selStudentId, setSelStudentId] = useState("");
  const [selDate, setSelDate] = useState(new Date().toISOString().slice(0, 10));
  const [selStatus, setSelStatus] = useState("present");
  const [selNote, setSelNote] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.attendance.list({ date: dateFilter || undefined });
      setRecords(data.items);
      setTotal(data.pagination.total);
    } catch { /* ignore */ }
  }, [dateFilter]);

  const loadClasses = useCallback(async () => {
    try {
      const data = await api.classes.list();
      setClasses(data.items);
      if (data.items.length > 0) setSelClassId(data.items[0]._id);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadClasses(); }, [loadClasses]);

  useEffect(() => {
    if (!selClassId) return;
    api.registrations.list({ classId: selClassId }).then((data) => {
      setRegistrations(data.items);
      if (data.items.length > 0) setSelStudentId(data.items[0].studentId._id);
    }).catch(() => setRegistrations([]));
  }, [selClassId]);

  const openCreate = () => {
    setCreateError(""); setSelNote(""); setSelStatus("present");
    setSelDate(new Date().toISOString().slice(0, 10));
    setDialogOpen(true);
  };

  const onCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(""); setCreateLoading(true);
    try {
      await api.attendance.create({
        classId: selClassId,
        studentId: selStudentId,
        date: selDate,
        status: selStatus,
        note: selNote,
      });
      setDialogOpen(false);
      await load();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Điểm danh" description={`${total} bản ghi`}>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Điểm danh
        </Button>
      </PageHeader>

      <div className="flex items-center gap-3">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <Input
          type="date"
          className="max-w-[200px]"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        <Button variant="outline" size="sm" onClick={() => setDateFilter("")}>
          Tất cả
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Học sinh</TableHead>
                <TableHead>Lớp</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => {
                const st = STATUS_MAP[r.status] || { label: r.status, variant: "secondary" as const };
                return (
                  <TableRow key={r._id}>
                    <TableCell className="font-medium">{r.studentId?.name || "-"}</TableCell>
                    <TableCell>{r.classId?.name || "-"}</TableCell>
                    <TableCell>{new Date(r.date).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.note || "-"}</TableCell>
                  </TableRow>
                );
              })}
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Chưa có bản ghi điểm danh
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Điểm danh</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreateSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label>Lớp</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={selClassId}
                onChange={(e) => setSelClassId(e.target.value)}
                required
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} ({c.timeSlot})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Học sinh (đã đăng ký lớp)</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={selStudentId}
                onChange={(e) => setSelStudentId(e.target.value)}
                required
              >
                {registrations.length === 0 && <option value="">-- Không có HS đăng ký --</option>}
                {registrations.map((r) => (
                  <option key={r.studentId._id} value={r.studentId._id}>{r.studentId.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày</Label>
                <Input type="date" value={selDate} onChange={(e) => setSelDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={selStatus}
                  onChange={(e) => setSelStatus(e.target.value)}
                >
                  <option value="present">Có mặt</option>
                  <option value="absent">Vắng</option>
                  <option value="late">Trễ</option>
                  <option value="excused">Có phép</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Input value={selNote} onChange={(e) => setSelNote(e.target.value)} placeholder="(tuỳ chọn)" />
            </div>
            {createError && <p className="text-sm text-destructive">{createError}</p>}
            <Button type="submit" disabled={createLoading}>
              {createLoading ? "Đang lưu..." : "Lưu điểm danh"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
