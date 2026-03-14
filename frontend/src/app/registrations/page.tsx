"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Trash2 } from "lucide-react";
import { api, type Registration } from "@/lib/api";

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function RegistrationsPage() {
  const [list, setList] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await api.registrations.list();
      setList(data.items);
      setTotal(data.pagination.total);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onDelete = async (id: string) => {
    if (!confirm("Huỷ đăng ký lớp này?")) return;
    try {
      const result = await api.registrations.delete(id);
      if (result.refunded) alert("Đã hoàn buổi cho học sinh.");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lỗi");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Đăng ký lớp" description={`${total} đăng ký`} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Học sinh</TableHead>
                <TableHead>Lớp</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Khung giờ</TableHead>
                <TableHead>Ngày đăng ký</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="font-medium">{r.studentId?.name || "-"}</TableCell>
                  <TableCell>{r.classId?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {DAY_LABELS[r.classId?.dayOfWeek] || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.classId?.timeSlot || "-"}</TableCell>
                  <TableCell>{new Date(r.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(r._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Chưa có đăng ký nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
