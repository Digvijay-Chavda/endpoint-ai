'use client';

import { Endpoint } from '@/types';
import { Copy, Trash2, ExternalLink, Activity, Pencil } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function EndpointList({ 
  projectId,
  endpoints, 
  onRefresh,
  onEdit
}: { 
  projectId: string;
  endpoints: Endpoint[];
  onRefresh: () => void;
  onEdit: (ep: Endpoint) => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this endpoint?')) return;
    await fetch(`/api/endpoints/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await fetch(`/api/endpoints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !currentStatus }),
    });
    onRefresh();
  };

  const copyUrl = (path: string, id: string) => {
    const fullUrl = `${window.location.origin}/mock/${projectId}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!projectId) {
    return (
      <Card className="text-center py-12 border-dashed">
        <CardContent className="flex flex-col items-center justify-center text-muted-foreground p-0">
          <p>Please select a project to view endpoints.</p>
        </CardContent>
      </Card>
    );
  }

  if (endpoints.length === 0) {
    return (
      <Card className="text-center py-12 border-dashed">
        <CardContent className="flex flex-col items-center justify-center text-muted-foreground p-0">
          <Activity className="w-12 h-12 mb-4 opacity-50" />
          <p>This project has no endpoints. Create one to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {endpoints.map((ep) => (
        <Card key={ep.id} className="relative overflow-hidden">
          {/* Status Indicator Bar */}
          <div className={`absolute top-0 left-0 w-1 h-full ${ep.active ? 'bg-green-500' : 'bg-muted'}`} />
          
          <CardContent className="p-4 flex justify-between items-start ml-2">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Badge variant="outline" className={`font-bold ${getMethodColor(ep.method)}`}>
                  {ep.method}
                </Badge>
                <span className="font-mono text-lg font-bold">
                  /mock/{projectId}{ep.path}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                <span className="flex items-center gap-1">
                  Delay: {ep.latencyMs}ms
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  Error Rate: {ep.errorRate * 100}%
                </span>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={ep.active} 
                    onCheckedChange={() => handleToggleActive(ep.id, ep.active)} 
                  />
                  <span>{ep.active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="secondary"
                size="icon"
                title="Copy URL"
                onClick={() => copyUrl(ep.path, ep.id)}
              >
                {copiedId === ep.id ? <span className="text-green-500 text-xs">Copied</span> : <Copy className="w-4 h-4" />}
              </Button>
              <a 
                href={`/mock/${projectId}${ep.path}`} 
                target="_blank" 
                rel="noreferrer"
                className={buttonVariants({ variant: "secondary", size: "icon" })}
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <Button 
                variant="secondary"
                size="icon"
                onClick={() => onEdit(ep)}
                title="Edit Endpoint"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button 
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(ep.id)}
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function getMethodColor(method: string) {
  switch (method) {
    case 'GET': return 'text-blue-500 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
    case 'POST': return 'text-green-500 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
    case 'PUT': return 'text-yellow-500 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
    case 'DELETE': return 'text-red-500 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
    case 'PATCH': return 'text-purple-500 border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950';
    default: return 'text-gray-500 border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
  }
}
