"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Share, Eye, Settings, Undo, Redo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useCollaborativeMap, useCollaborativeCursors, usePresence } from "@/hooks/useRealtime";

// This is a stub implementation for the visual editor
// The actual Konva integration would be implemented here

export default function EditorPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  // Real-time collaboration hooks
  const { data: sceneData, setValue: setSceneValue } = useCollaborativeMap(
    `site-${siteId}`,
    "scene"
  );
  const { cursors, updateCursor } = useCollaborativeCursors(`site-${siteId}`);
  const users = usePresence(`site-${siteId}`, { name: "You", color: "#3b82f6" });

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        {/* Editor Header */}
        <header className="h-14 border-b flex items-center px-4 justify-between bg-background">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="font-semibold">Visual Editor</h1>
              <p className="text-xs text-muted-foreground">Site ID: {siteId}</p>
            </div>
            <Badge variant="outline" className="ml-4">
              Draft
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <Tooltip>
              <TooltipTrigger>
                <Button variant="ghost" size="icon">
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button variant="ghost" size="icon">
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-2" />

            {/* Online users indicator */}
            {Array.from(users.entries()).length > 0 && (
              <div className="flex items-center gap-1 mr-2">
                <div className="flex -space-x-2">
                  {Array.from(users.entries()).slice(0, 3).map(([id, user]) => (
                    <div
                      key={id}
                      className="w-6 h-6 rounded-full border-2 border-background"
                      style={{ backgroundColor: user.color }}
                      title={user.name}
                    />
                  ))}
                </div>
                {users.size > 3 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    +{users.size - 3}
                  </span>
                )}
              </div>
            )}

            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button variant="outline" size="sm">
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button size="sm">
              <Save className="mr-2 h-4 w-4" />
              Publish
            </Button>
          </div>
        </header>

        {/* Editor Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Tools */}
          <aside className="w-16 border-r bg-muted/30 flex flex-col items-center py-4 gap-2">
            <Tooltip>
              <TooltipTrigger>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                    />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Select</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Image</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Text</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Shape</TooltipContent>
            </Tooltip>
            <Separator className="my-2" />
            <Tooltip>
              <TooltipTrigger>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <Settings className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          </aside>

          {/* Canvas Area */}
          <main className="flex-1 bg-muted/50 relative overflow-auto">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white shadow-xl rounded-lg overflow-hidden" style={{ width: 800, height: 600 }}>
                {/* This is where the Konva canvas would be mounted */}
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <p className="text-lg font-medium mb-2">Visual Editor Canvas</p>
                    <p className="text-sm">Konva integration would be implemented here</p>
                    <p className="text-xs mt-4 text-muted-foreground">
                      Real-time collaboration active • {users.size + 1} users online
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Right Sidebar - Properties */}
          <aside className="w-72 border-l bg-background p-4">
            <h3 className="font-semibold mb-4">Properties</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">X</label>
                    <input
                      type="number"
                      className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                      placeholder="0"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Y</label>
                    <input
                      type="number"
                      className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                      placeholder="0"
                      readOnly
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Width</label>
                    <input
                      type="number"
                      className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                      placeholder="100"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Height</label>
                    <input
                      type="number"
                      className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                      placeholder="100"
                      readOnly
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Layer</label>
                <select className="w-full h-9 px-3 rounded-md border bg-background text-sm">
                  <option>Background</option>
                  <option>Content</option>
                  <option>Overlay</option>
                </select>
              </div>
            </div>

            <Separator className="my-6" />

            <h3 className="font-semibold mb-4">Scene Graph</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="text-sm">Background Layer</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer ml-4">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Background Image</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-primary/10 cursor-pointer">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium">Title Text</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer ml-4">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm">Body Text</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
}
