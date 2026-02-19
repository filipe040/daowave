"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Need to check if this exists or use basic HTML table
import { Badge } from "@/components/ui/badge"; // Check if exists
import { Check, X, MoreHorizontal } from "lucide-react";

interface Organization {
    id: string;
    name: string;
    slug: string;
    status: string;
    members: { role: string; user: { name: string; email: string } }[];
    _count: { events: number };
}

export default function AdminOrganizationsPage() {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrgs = () => {
        fetch("/api/admin/organizations")
            .then((res) => res.json())
            .then((data) => {
                if (data.data) setOrgs(data.data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchOrgs();
    }, []);

    const updateStatus = async (id: string, status: string) => {
        await fetch(`/api/admin/organizations/${id}/approve`, {
            method: "POST",
            body: JSON.stringify({ status }),
            headers: { "Content-Type": "application/json" }
        });
        fetchOrgs();
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Organizações</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Todos os Promotores</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Simple Table Fallback if UI component missing */}
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#111827] text-white h-10">
                                <tr>
                                    <th className="px-4">Nome</th>
                                    <th className="px-4">Owner</th>
                                    <th className="px-4">Eventos</th>
                                    <th className="px-4">Status</th>
                                    <th className="px-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orgs.map((org) => (
                                    <tr key={org.id} className="border-b hover:bg-zinc-50">
                                        <td className="px-4 py-3 font-medium">{org.name} <br /><span className="text-xs text-muted-foreground">{org.slug}</span></td>
                                        <td className="px-4 py-3">
                                            {org.members[0]?.user.name} <br />
                                            <span className="text-xs text-muted-foreground">{org.members[0]?.user.email}</span>
                                        </td>
                                        <td className="px-4 py-3">{org._count.events}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${org.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                    org.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {org.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            {org.status === 'PENDING' && (
                                                <>
                                                    <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => updateStatus(org.id, 'ACTIVE')}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => updateStatus(org.id, 'REJECTED')}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {orgs.length === 0 && !loading && (
                            <div className="text-center py-10 text-muted-foreground">Nenhuma organização encontrada.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
