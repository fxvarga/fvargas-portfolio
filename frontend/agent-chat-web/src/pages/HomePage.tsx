import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '@/api/client';
import type { RunSummary } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate, formatTimestamp } from '@/lib/utils';
import { Bot, Plus, MessageSquare, Loader2, BookOpen } from 'lucide-react';

// Map numeric status to string
const statusMap: Record<number, string> = {
  0: 'Pending',
  1: 'Running',
  2: 'WaitingForApproval',
  3: 'Completed',
  4: 'Failed',
  5: 'Cancelled',
};

function normalizeStatus(status: string | number): string {
  if (typeof status === 'number') {
    return statusMap[status] ?? 'Unknown';
  }
  return status;
}

export function HomePage() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      const data = await api.listRuns();
      setRuns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    navigate('/chat');
  };

  const handleOpenRun = (runId: string) => {
    navigate(`/chat/${runId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-purple-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-100">Agent Chat</h1>
                <p className="text-sm text-gray-400">
                  Enterprise Agentic AI Platform
                </p>
              </div>
            </div>
            <Button onClick={handleNewChat}>
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
            <Button variant="secondary" onClick={() => navigate('/knowledge')}>
              <BookOpen className="w-4 h-4 mr-2" />
              Knowledge Base
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">
          Recent Conversations
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center text-red-400">
              {error}
            </CardContent>
          </Card>
        ) : runs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No conversations yet</p>
              <Button onClick={handleNewChat}>Start a conversation</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => {
              const status = normalizeStatus(run.status);
              const preview = run.firstUserMessage 
                ? run.firstUserMessage.slice(0, 60) + (run.firstUserMessage.length > 60 ? '...' : '')
                : `Run ${run.runId.slice(0, 8)}...`;
              const eventCount = run.eventCount ?? (run.messageCount ?? 0) + (run.stepCount ?? 0);
              
              return (
                <Card
                  key={run.runId}
                  className="cursor-pointer hover:border-gray-600 transition-colors"
                  onClick={() => handleOpenRun(run.runId)}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-gray-200 font-medium">
                            {preview}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(run.createdAt)} at{' '}
                            {formatTimestamp(run.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {eventCount} events
                        </span>
                        <StatusDot status={status} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Pending: 'bg-gray-500',
    Running: 'bg-blue-500',
    WaitingForApproval: 'bg-yellow-500',
    Completed: 'bg-green-500',
    Failed: 'bg-red-500',
    Cancelled: 'bg-gray-500',
  };

  return (
    <span
      className={`w-2 h-2 rounded-full ${colors[status] ?? 'bg-gray-500'}`}
      title={status}
    />
  );
}
