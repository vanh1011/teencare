"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Plus, Search, UserPlus } from "lucide-react";
import { api, type ClassItem } from "@/lib/api";

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const DAY_COLORS = [
  "border-red-200 bg-red-50",
  "border-blue-200 bg-blue-50",
  "border-green-200 bg-green-50",
  "border-yellow-200 bg-yellow-50",
  "border-purple-200 bg-purple-50",
  "border-pink-200 bg-pink-50",
  "border-orange-200 bg-orange-50",
];

type StudentOption = { _id: string; name: string };

export default function ClassesPage() {
  const [classesByDay, setClassesByDay] = useState<ClassItem[][]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [search, setSearch] = useState("");
  const [registerClassId, setRegisterClassId] = useState<string | null>(null);
  const [registerStudentId, setRegisterStudentId] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cSubject, setCSubject] = useState("");
  const [cDay, setCDay] = useState("1");
  const [cTime, setCTime] = useState("");
  const [cTeacher, setCTeacher] = useState("");
  const [cMax, setCMax] = useState("20");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const loadClasses = useCallback(async () => {
    const all: ClassItem[][] = [];
    for (let day = 0; day < 7; day++) {
      const data = await api.classes.list({ day, search: search || undefined });
      all.push(data.items);
    }
    setClassesByDay(all);
  }, [search]);

  const loadStudents = useCallback(async () => {
    const data = await api.students.list();
    setStudents(data.items.map((s) => ({ _id: s._id, name: s.name })));
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => { loadStudents(); }, [loadStudents]);

  const openRegister = (classId: string) => {
    setRegisterClassId(classId);
    setRegisterStudentId(students[0]?._id ?? "");
    setRegisterError("");
    setDialogOpen(true);
  };

  const onRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerClassId || !registerStudentId) return;
    setRegisterError(""); setRegisterLoading(true);
    try {
      await api.register(registerClassId, registerStudentId);
      setDialogOpen(false);
      await loadClasses();
    } catch (e) {
      setRegisterError(e instanceof Error ? e.message : "Đăng ký thất bại");
    } finally {
      setRegisterLoading(false);
    }
  };

  const onCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(""); setCreateLoading(true);
    try {
      await api.classes.create({
        name: cName, subject: cSubject, dayOfWeek: Number(cDay),
        timeSlot: cTime, teacherName: cTeacher, maxStudents: Number(cMax),
      });
      setCreateOpen(false);
      setCName(""); setCSubject(""); setCTime(""); setCTeacher("");
      await loadClasses();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Lỗi tạo lớp");
    } finally {
      setCreateLoading(false);
    }
  };

  const totalClasses = classesByDay.reduce((a, b) => a + b.length, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Lớp học" description={`${totalClasses} lớp trong tuần`}>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Tạo lớp
        </Button>
      </PageHeader>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm tên lớp, môn, giáo viên..."
          className="max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {classesByDay.map((dayClasses, day) => (
          <Card key={day} className={`border-2 ${DAY_COLORS[day]}`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{DAY_LABELS[day]}</span>
                <Badge variant="secondary">{dayClasses.length} lớp</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dayClasses.length === 0 && <p className="text-xs text-muted-foreground">Không có lớp</p>}
              {dayClasses.map((c) => (
                <div key={c._id} className="rounded-lg border bg-white p-3 shadow-sm">
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.subject} | {c.timeSlot}</p>
                  <p className="text-xs text-muted-foreground">GV: {c.teacherName} | Max: {c.maxStudents}</p>
                  <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => openRegister(c._id)}>
                    <UserPlus className="mr-1 h-3.5 w-3.5" /> Đăng ký HS
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Register dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đăng ký học sinh vào lớp</DialogTitle>
          </DialogHeader>
          <form onSubmit={onRegisterSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label>Học sinh</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={registerStudentId}
                onChange={(e) => setRegisterStudentId(e.target.value)}
              >
                {students.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            {registerError && <p className="text-sm text-destructive">{registerError}</p>}
            <Button type="submit" disabled={registerLoading}>
              {registerLoading ? "Đang xử lý..." : "Xác nhận đăng ký"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create class dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo lớp mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreateSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label>Tên lớp</Label>
              <Input value={cName} onChange={(e) => setCName(e.target.value)} required placeholder="Toán nâng cao" />
            </div>
            <div className="space-y-2">
              <Label>Môn học</Label>
              <Input value={cSubject} onChange={(e) => setCSubject(e.target.value)} required placeholder="Toán" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={cDay}
                  onChange={(e) => setCDay(e.target.value)}
                >
                  {DAY_LABELS.map((l, i) => <option key={i} value={i}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Khung giờ</Label>
                <Input value={cTime} onChange={(e) => setCTime(e.target.value)} required placeholder="08:00 - 09:30" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giáo viên</Label>
                <Input value={cTeacher} onChange={(e) => setCTeacher(e.target.value)} required placeholder="Nguyễn A" />
              </div>
              <div className="space-y-2">
                <Label>Sĩ số tối đa</Label>
                <Input type="number" min={1} value={cMax} onChange={(e) => setCMax(e.target.value)} required />
              </div>
            </div>
            {createError && <p className="text-sm text-destructive">{createError}</p>}
            <Button type="submit" disabled={createLoading}>
              {createLoading ? "Đang tạo..." : "Tạo lớp"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
