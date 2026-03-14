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
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { api, type Student, type Parent } from "@/lib/api";

export default function StudentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("male");
  const [currentGrade, setCurrentGrade] = useState("");
  const [parentId, setParentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadParents = useCallback(async () => {
    try {
      const data = await api.parents.list();
      setParents(data.items);
    } catch { /* ignore */ }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      const data = await api.students.list({ search: search || undefined });
      setStudents(data.items);
      setTotal(data.pagination.total);
    } catch { /* ignore */ }
  }, [search]);

  useEffect(() => { loadParents(); }, [loadParents]);
  useEffect(() => { loadStudents(); }, [loadStudents]);

  const openCreate = () => {
    setEditId(null);
    setName(""); setDob(""); setGender("male"); setCurrentGrade("");
    setParentId(parents[0]?._id || "");
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditId(s._id);
    setName(s.name);
    setDob(s.dob ? s.dob.slice(0, 10) : "");
    setGender(s.gender);
    setCurrentGrade(s.currentGrade);
    setParentId(s.parentId?._id || "");
    setError("");
    setDialogOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (editId) {
        await api.students.update(editId, { name, dob, gender, current_grade: currentGrade, parent_id: parentId });
      } else {
        await api.students.create({ name, dob, gender, current_grade: currentGrade, parent_id: parentId });
      }
      setDialogOpen(false);
      await loadStudents();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Xoá học sinh này?")) return;
    try {
      await api.students.delete(id);
      await loadStudents();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lỗi xoá");
    }
  };

  const genderLabel = (g: string) => g === "male" ? "Nam" : g === "female" ? "Nữ" : g;

  return (
    <div className="space-y-6">
      <PageHeader title="Học sinh" description={`Tổng cộng ${total} học sinh`}>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Thêm mới
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên..."
              className="max-w-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Giới tính</TableHead>
                <TableHead>Lớp</TableHead>
                <TableHead>Phụ huynh</TableHead>
                <TableHead>Ngày sinh</TableHead>
                <TableHead className="w-24 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s._id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{genderLabel(s.gender)}</Badge>
                  </TableCell>
                  <TableCell>{s.currentGrade}</TableCell>
                  <TableCell>{s.parentId?.name || "-"}</TableCell>
                  <TableCell>{s.dob ? new Date(s.dob).toLocaleDateString("vi-VN") : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(s._id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Chưa có học sinh nào
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
            <DialogTitle>{editId ? "Sửa học sinh" : "Thêm học sinh"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label>Họ tên</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nguyễn Văn B" />
            </div>
            <div className="space-y-2">
              <Label>Ngày sinh</Label>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Giới tính</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Lớp hiện tại</Label>
              <Input value={currentGrade} onChange={(e) => setCurrentGrade(e.target.value)} required placeholder="4" />
            </div>
            <div className="space-y-2">
              <Label>Phụ huynh</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                required
              >
                <option value="">-- Chọn phụ huynh --</option>
                {parents.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} – {p.phone}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : editId ? "Cập nhật" : "Tạo mới"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
