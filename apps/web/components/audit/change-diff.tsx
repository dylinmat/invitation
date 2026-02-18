"use client";

import { cn } from "@/lib/utils";
import { AuditChange } from "@/types/audit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Edit3,
  FileText,
} from "lucide-react";
import { useState } from "react";

// ============================================================================
// Diff Value Renderer
// ============================================================================

interface DiffValueProps {
  value: unknown;
  type: "old" | "new";
}

function DiffValue({ value, type }: DiffValueProps) {
  const colorClass = type === "old" 
    ? "text-red-700 bg-red-50" 
    : "text-green-700 bg-green-50";

  if (value === null || value === undefined) {
    return (
      <span className={cn("px-2 py-1 rounded text-xs font-mono", colorClass)}>
        {value === null ? "null" : "undefined"}
      </span>
    );
  }

  if (typeof value === "boolean") {
    return (
      <span className={cn("px-2 py-1 rounded text-xs font-mono", colorClass)}>
        {value ? "true" : "false"}
      </span>
    );
  }

  if (typeof value === "number") {
    return (
      <span className={cn("px-2 py-1 rounded text-xs font-mono", colorClass)}>
        {value}
      </span>
    );
  }

  if (typeof value === "string") {
    // Check if it's a date
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return (
        <span className={cn("px-2 py-1 rounded text-xs", colorClass)}>
          {new Date(value).toLocaleString()}
        </span>
      );
    }
    
    // Long text truncation
    if (value.length > 100) {
      return (
        <span className={cn("px-2 py-1 rounded text-xs", colorClass)}>
          &quot;{value.slice(0, 100)}...&quot;
        </span>
      );
    }
    
    return (
      <span className={cn("px-2 py-1 rounded text-xs", colorClass)}>
        &quot;{value}&quot;
      </span>
    );
  }

  if (Array.isArray(value)) {
    return (
      <span className={cn("px-2 py-1 rounded text-xs font-mono", colorClass)}>
        [{value.length} items]
      </span>
    );
  }

  if (typeof value === "object") {
    return (
      <pre className={cn("px-2 py-1 rounded text-xs overflow-x-auto", colorClass)}>
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return (
    <span className={cn("px-2 py-1 rounded text-xs", colorClass)}>
      {String(value)}
    </span>
  );
}

// ============================================================================
// Change Type Icon
// ============================================================================

function ChangeTypeIcon({ oldValue, newValue }: { oldValue: unknown; newValue: unknown }) {
  if (oldValue === undefined || oldValue === null) {
    return <Plus className="h-4 w-4 text-green-600" />;
  }
  if (newValue === undefined || newValue === null) {
    return <Minus className="h-4 w-4 text-red-600" />;
  }
  return <Edit3 className="h-4 w-4 text-blue-600" />;
}

function ChangeTypeBadge({ oldValue, newValue }: { oldValue: unknown; newValue: unknown }) {
  if (oldValue === undefined || oldValue === null) {
    return (
      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
        Added
      </Badge>
    );
  }
  if (newValue === undefined || newValue === null) {
    return (
      <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
        Removed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
      Modified
    </Badge>
  );
}

// ============================================================================
// Single Change Row
// ============================================================================

interface ChangeRowProps {
  change: AuditChange;
  isExpanded?: boolean;
}

function ChangeRow({ change, isExpanded: defaultExpanded = false }: ChangeRowProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasComplexValue = 
    typeof change.oldValue === "object" && change.oldValue !== null ||
    typeof change.newValue === "object" && change.newValue !== null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
              isExpanded && "border-b"
            )}
          >
            {hasComplexValue ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <div className="w-4" />
            )}
            
            <ChangeTypeIcon oldValue={change.oldValue} newValue={change.newValue} />
            
            <code className="text-sm font-semibold flex-1">
              {change.field}
            </code>
            
            <ChangeTypeBadge oldValue={change.oldValue} newValue={change.newValue} />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="grid grid-cols-2 divide-x">
            {/* Old Value */}
            <div className="p-3 bg-red-50/50">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Minus className="h-3 w-3" />
                Before
              </p>
              <DiffValue value={change.oldValue} type="old" />
            </div>
            
            {/* New Value */}
            <div className="p-3 bg-green-50/50">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Plus className="h-3 w-3" />
                After
              </p>
              <DiffValue value={change.newValue} type="new" />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {!isExpanded && !hasComplexValue && (
        <div className="grid grid-cols-2 divide-x text-sm">
          <div className="p-2 px-3 text-red-700 bg-red-50/30 truncate">
            {change.oldValue === null || change.oldValue === undefined
              ? "—"
              : String(change.oldValue).slice(0, 50)}
          </div>
          <div className="p-2 px-3 text-green-700 bg-green-50/30 truncate">
            {change.newValue === null || change.newValue === undefined
              ? "—"
              : String(change.newValue).slice(0, 50)}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Props
// ============================================================================

interface ChangeDiffProps {
  changes?: AuditChange[];
  className?: string;
  title?: string;
  defaultExpanded?: boolean;
  showSummary?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function ChangeDiff({
  changes = [],
  className,
  title = "Changes",
  defaultExpanded = false,
  showSummary = true,
}: ChangeDiffProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (changes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No changes recorded</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary stats
  const added = changes.filter(c => c.oldValue === null || c.oldValue === undefined).length;
  const removed = changes.filter(c => c.newValue === null || c.newValue === undefined).length;
  const modified = changes.length - added - removed;

  return (
    <Card className={className}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">{title}</CardTitle>
                <Badge variant="secondary">{changes.length} fields</Badge>
                
                {showSummary && (
                  <div className="hidden sm:flex items-center gap-2">
                    {added > 0 && (
                      <Badge variant="outline" className="text-green-600 bg-green-50">
                        +{added}
                      </Badge>
                    )}
                    {removed > 0 && (
                      <Badge variant="outline" className="text-red-600 bg-red-50">
                        -{removed}
                      </Badge>
                    )}
                    {modified > 0 && (
                      <Badge variant="outline" className="text-blue-600 bg-blue-50">
                        ~{modified}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {changes.map((change, index) => (
                <ChangeRow
                  key={`${change.field}-${index}`}
                  change={change}
                  isExpanded={defaultExpanded}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================================================
// Inline Diff (for table rows)
// ============================================================================

interface InlineDiffProps {
  changes?: AuditChange[];
  maxDisplay?: number;
}

export function InlineDiff({ changes = [], maxDisplay = 3 }: InlineDiffProps) {
  if (changes.length === 0) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const displayChanges = changes.slice(0, maxDisplay);
  const remaining = changes.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {displayChanges.map((change, index) => (
        <Badge
          key={index}
          variant="outline"
          className={cn(
            "text-xs",
            change.oldValue === null || change.oldValue === undefined
              ? "text-green-600 border-green-200"
              : change.newValue === null || change.newValue === undefined
              ? "text-red-600 border-red-200"
              : "text-blue-600 border-blue-200"
          )}
        >
          {change.field}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remaining} more
        </Badge>
      )}
    </div>
  );
}

export default ChangeDiff;
