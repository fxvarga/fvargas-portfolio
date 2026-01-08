import { cn, truncateValue } from '@/lib/utils';
import { Badge, RiskBadge } from '@/components/ui/Badge';
import { formatJson } from '@/lib/utils';
import type { ToolCallDto } from '@/types';
import {
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ToolCallCardProps {
  toolCall: ToolCallDto;
}

interface FileResult {
  success: boolean;
  file_name: string;
  content_base64: string;
  mime_type: string;
  file_size_bytes?: number;
}

function isFileResult(result: unknown): result is FileResult {
  if (!result || typeof result !== 'object') return false;
  const r = result as Record<string, unknown>;
  return (
    r.success === true &&
    typeof r.file_name === 'string' &&
    typeof r.content_base64 === 'string' &&
    typeof r.mime_type === 'string'
  );
}

function downloadFile(fileResult: FileResult) {
  // Convert base64 to blob
  const byteCharacters = atob(fileResult.content_base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: fileResult.mime_type });

  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileResult.file_name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileDownloadCard({ fileResult }: { fileResult: FileResult }) {
  const isExcel = fileResult.mime_type.includes('spreadsheet') || 
                  fileResult.file_name.endsWith('.xlsx');
  
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900/80 rounded-lg border border-green-700/30">
      <div className="p-2.5 bg-green-500/10 rounded-lg">
        {isExcel ? (
          <FileSpreadsheet className="w-5 h-5 text-green-400" />
        ) : (
          <Download className="w-5 h-5 text-green-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">
          {fileResult.file_name}
        </p>
        {fileResult.file_size_bytes && (
          <p className="text-xs text-gray-500">
            {formatFileSize(fileResult.file_size_bytes)}
          </p>
        )}
      </div>
      <button
        onClick={() => downloadFile(fileResult)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white text-sm font-medium rounded-lg transition-all duration-150 shadow-sm hover:shadow-md min-h-[44px]"
        aria-label={`Download ${fileResult.file_name}`}
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Download</span>
      </button>
    </div>
  );
}

/** Status label for screen readers */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    running: 'Currently executing',
    success: 'Completed successfully',
    error: 'Failed with error',
    awaiting_approval: 'Awaiting approval',
  };
  return labels[status] || status;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  
  // Format args for display
  const formattedArgs = formatJson(toolCall.args);
  const formattedResult = toolCall.result ? formatJson(toolCall.result) : null;
  const argsPreview = truncateValue(toolCall.args, 80);

  // Measure content height for animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded, formattedArgs, formattedResult]);

  const statusConfig: Record<string, { icon: React.ReactNode; label: string }> = {
    pending: { 
      icon: <Clock className="w-4 h-4 text-gray-400" />,
      label: 'Pending'
    },
    running: { 
      icon: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
      label: 'Running'
    },
    success: { 
      icon: <CheckCircle className="w-4 h-4 text-green-400" />,
      label: 'Success'
    },
    error: { 
      icon: <XCircle className="w-4 h-4 text-red-400" />,
      label: 'Error'
    },
    awaiting_approval: { 
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      label: 'Awaiting Approval'
    },
  };

  const getStatus = () => {
    if (toolCall.error) return 'error';
    if (toolCall.result !== undefined) return 'success';
    if (toolCall.approvalId && toolCall.status === 'pending') {
      return 'awaiting_approval';
    }
    if (toolCall.status === 'running') return 'running';
    return toolCall.status || 'pending';
  };

  const status = getStatus();
  const statusInfo = statusConfig[status] || statusConfig.pending;

  return (
    <div 
      className="my-3 mx-4 md:mx-6 animate-tool-in"
      role="region"
      aria-label={`Tool call: ${toolCall.toolName}`}
    >
      {/* Timeline connector dot */}
      <div className="relative">
        <div 
          className={cn(
            'absolute -left-6 md:-left-8 top-4 w-3 h-3 rounded-full border-2 hidden md:block',
            status === 'error' 
              ? 'bg-red-500/20 border-red-500' 
              : status === 'success'
                ? 'bg-green-500/20 border-green-500'
                : status === 'running'
                  ? 'bg-blue-500/20 border-blue-500 animate-pulse'
                  : 'bg-gray-600/20 border-gray-500'
          )}
          aria-hidden="true"
        />
        
        <div
          className={cn(
            'border rounded-xl overflow-hidden transition-all duration-200',
            status === 'error'
              ? 'border-red-700/50 bg-red-950/30'
              : status === 'awaiting_approval'
                ? 'border-amber-700/50 bg-amber-950/30'
                : status === 'running'
                  ? 'border-blue-700/50 bg-blue-950/20'
                  : 'border-gray-700/50 bg-gray-800/30',
            isExpanded && 'shadow-lg'
          )}
        >
          {/* Header - Clickable area with proper touch target */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls={`tool-content-${toolCall.id}`}
            aria-label={`${toolCall.toolName} tool. Risk: ${toolCall.riskTier}. Status: ${getStatusLabel(status)}. ${isExpanded ? 'Collapse' : 'Expand'} to view details.`}
            className={cn(
              'w-full flex items-center gap-3 p-4 text-left transition-colors duration-150 min-h-[56px] group',
              'hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500/50'
            )}
          >
            {/* Chevron with rotation animation */}
            <span 
              className={cn(
                'flex-shrink-0 transition-transform duration-200',
                isExpanded && 'rotate-90'
              )}
              aria-hidden="true"
            >
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-400" />
            </span>
            
            {/* Tool icon */}
            <span className="flex-shrink-0 p-1.5 bg-gray-700/50 rounded-lg" aria-hidden="true">
              <Wrench className="w-4 h-4 text-gray-400" />
            </span>
            
            {/* Tool name */}
            <span className="font-mono text-sm font-medium text-gray-200 truncate">
              {toolCall.toolName}
            </span>
            
            {/* Spacer */}
            <span className="flex-1" />
            
            {/* Risk badge and status */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <RiskBadge riskTier={toolCall.riskTier} />
              <span aria-label={statusInfo.label}>
                {statusInfo.icon}
              </span>
            </div>
          </button>

          {/* Running state indicator */}
          {status === 'running' && (
            <div className="px-4 pb-3 flex items-center gap-2 text-sm text-blue-400">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              <span>Executing tool...</span>
            </div>
          )}

          {/* Expandable content with animation */}
          <div
            id={`tool-content-${toolCall.id}`}
            className={cn(
              'overflow-hidden transition-all duration-200 ease-out',
              isExpanded ? 'opacity-100' : 'opacity-0'
            )}
            style={{ 
              maxHeight: isExpanded ? `${contentHeight + 100}px` : '0px'
            }}
          >
            <div ref={contentRef} className="border-t border-gray-700/50 p-4 space-y-4">
              {/* Arguments */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                  Arguments
                </label>
                <pre className="p-3 bg-gray-900/80 rounded-lg text-xs text-gray-300 overflow-x-auto max-h-48 font-mono border border-gray-800">
                  {formattedArgs}
                </pre>
              </div>

              {/* Result */}
              {toolCall.result && isFileResult(toolCall.result) ? (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                    Generated File
                  </label>
                  <FileDownloadCard fileResult={toolCall.result} />
                </div>
              ) : formattedResult ? (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                    Result
                  </label>
                  <pre className="p-3 bg-gray-900/80 rounded-lg text-xs text-gray-300 overflow-x-auto max-h-48 font-mono border border-gray-800">
                    {formattedResult}
                  </pre>
                </div>
              ) : null}

              {/* Error */}
              {toolCall.error && (
                <div role="alert">
                  <label className="block text-xs font-medium text-red-400 mb-2 uppercase tracking-wide">
                    Error
                  </label>
                  <pre className="p-3 bg-red-950/50 rounded-lg text-xs text-red-300 overflow-x-auto border border-red-800/50 font-mono">
                    {toolCall.error}
                  </pre>
                </div>
              )}

              {/* Approval status */}
              {toolCall.approvalId && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-700/50">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Approval:</span>
                  <Badge
                    variant={
                      toolCall.status === 'approved'
                        ? 'success'
                        : toolCall.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {toolCall.status}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Collapsed preview - more compact */}
          {!isExpanded && status !== 'running' && (
            <div className="px-4 pb-3 text-xs text-gray-500 truncate">
              {toolCall.result && isFileResult(toolCall.result) ? (
                <span className="inline-flex items-center gap-1.5 text-green-400">
                  <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{toolCall.result.file_name} ready for download</span>
                </span>
              ) : (
                <span className="font-mono opacity-75">{argsPreview}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
