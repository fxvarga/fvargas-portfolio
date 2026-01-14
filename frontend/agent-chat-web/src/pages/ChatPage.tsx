import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '@/hooks/useChat';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { ApprovalList } from '@/components/approval/ApprovalList';
import { RunStatus, AssistantType } from '@/types';
import type { ChatTimelineItem } from '@/types';
import { 
  Loader2, 
  AlertCircle, 
  Bot, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ShieldAlert,
  Ban,
  Plus,
  MessageCircle,
  Briefcase
} from 'lucide-react';

export function ChatPage() {
  const { runId } = useParams<{ runId?: string }>();
  const navigate = useNavigate();
  const [selectedAssistantType, setSelectedAssistantType] = useState<AssistantType>(AssistantType.FinanceAdvisor);

  const {
    run,
    isLoading,
    error,
    isStreaming,
    streamingContent,
    pendingApprovals,
    resolvingApprovals,
    sendMessage,
    resolveApproval,
  } = useChat(runId);

  const handleSendMessage = async (content: string) => {
    // Pass the selected assistant type when creating a new run
    await sendMessage(content, !run ? selectedAssistantType : undefined);
  };

  const handleNewChat = () => {
    navigate('/chat');
  };

  const isDisabled =
    isLoading ||
    isStreaming ||
    run?.status === RunStatus.WaitingForApproval ||
    run?.status === RunStatus.Failed;

  const isCompleted = run?.status === RunStatus.Completed;

  // Combine messages and tool calls into a unified, chronologically sorted timeline
  const timelineItems = useMemo<ChatTimelineItem[]>(() => {
    const items: ChatTimelineItem[] = [];

    // Add messages
    for (const message of run?.messages ?? []) {
      items.push({
        type: 'message',
        data: message,
        timestamp: message.timestamp,
      });
    }

    // Add tool calls
    for (const toolCall of run?.toolCalls ?? []) {
      items.push({
        type: 'toolCall',
        data: toolCall,
        timestamp: toolCall.startedAt,
      });
    }

    // Sort by timestamp chronologically
    items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return items;
  }, [run?.messages, run?.toolCalls]);

  // Get appropriate placeholder message based on state
  const getPlaceholder = () => {
    if (run?.status === RunStatus.WaitingForApproval) {
      return 'Waiting for approval...';
    }
    if (isStreaming) {
      return 'Agent is thinking...';
    }
    if (isCompleted) {
      return 'This conversation has ended';
    }
    if (run?.status === RunStatus.WaitingInput) {
      return 'Continue the conversation...';
    }
    return 'Type a message...';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-700/50 bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-purple-500/10 rounded-lg">
            <Bot className="w-5 h-5 text-purple-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-100">Agent Chat</h1>
        </div>
        {run && (
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden sm:inline text-sm text-gray-400 font-mono">
              Run: {run.runId.slice(0, 8)}...
            </span>
            <StatusBadge status={run.status} />
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0">
        {isLoading && !run ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <span className="text-sm text-gray-400">Loading conversation...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md text-center">
              <div className="flex items-center justify-center gap-2 text-red-400 mb-3">
                <AlertCircle className="w-6 h-6" />
                <span className="font-semibold text-lg">Error</span>
              </div>
              <p className="text-gray-300 text-sm mb-4">{error}</p>
              {run?.status === RunStatus.Failed && (
                <p className="text-gray-500 text-xs">
                  The agent encountered an error while processing your request.
                  This could be due to a temporary service issue. Please try again.
                </p>
              )}
            </div>
          </div>
        ) : !run ? (
          /* New chat - show assistant type selector */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <h2 className="text-xl font-semibold text-gray-100 mb-6">Choose an Assistant</h2>
            <div className="grid grid-cols-1 gap-4 max-w-2xl w-full">
              {/* Portfolio Visitor - temporarily disabled
              <button
                onClick={() => setSelectedAssistantType(AssistantType.PortfolioVisitor)}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  selectedAssistantType === AssistantType.PortfolioVisitor
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    selectedAssistantType === AssistantType.PortfolioVisitor
                      ? 'bg-purple-500/20'
                      : 'bg-gray-700'
                  }`}>
                    <User className={`w-5 h-5 ${
                      selectedAssistantType === AssistantType.PortfolioVisitor
                        ? 'text-purple-400'
                        : 'text-gray-400'
                    }`} />
                  </div>
                  <span className="font-semibold text-gray-100">Portfolio Visitor</span>
                </div>
                <p className="text-sm text-gray-400">
                  Ask questions about Fernando's portfolio, projects, skills, and experience.
                </p>
              </button>
              */}
              
              <button
                onClick={() => setSelectedAssistantType(AssistantType.FinanceAdvisor)}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  selectedAssistantType === AssistantType.FinanceAdvisor
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    selectedAssistantType === AssistantType.FinanceAdvisor
                      ? 'bg-blue-500/20'
                      : 'bg-gray-700'
                  }`}>
                    <Briefcase className={`w-5 h-5 ${
                      selectedAssistantType === AssistantType.FinanceAdvisor
                        ? 'text-blue-400'
                        : 'text-gray-400'
                    }`} />
                  </div>
                  <span className="font-semibold text-gray-100">Finance Advisor</span>
                </div>
                <p className="text-sm text-gray-400">
                  Get help with financial planning, investment strategies, and market analysis.
                </p>
              </button>
            </div>

            {/* Demo Prompts */}
            <div className="mt-8 w-full max-w-2xl">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Try a demo prompt:</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "What's the status of the December 2024 close for entity US01?",
                  "Show me all pending journal entries awaiting approval",
                  "Generate a variance analysis comparing Q4 actuals vs budget",
                  "What reconciliations are still open for the current period?",
                  "Walk me through the month-end close procedure for fixed assets"
                ].map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-3 py-2 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg transition-all text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              Or type a message below to start your conversation
            </p>
          </div>
        ) : (
          <>
            {/* Unified Timeline - messages and tool calls interleaved chronologically */}
            <MessageList
              items={timelineItems}
              streamingContent={streamingContent}
              isStreaming={isStreaming}
              onSuggestionClick={handleSendMessage}
            />

            {/* Pending approvals */}
            <ApprovalList
              approvals={pendingApprovals}
              onResolve={resolveApproval}
              resolvingIds={resolvingApprovals}
            />
          </>
        )}

        {/* Completed state message */}
        {isCompleted && (
          <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-800/50 border-t border-gray-700/50">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">This conversation has ended.</span>
            <button
              onClick={handleNewChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Start new chat
            </button>
          </div>
        )}

        {/* Input */}
        <ChatInput
          onSend={handleSendMessage}
          disabled={isDisabled || isCompleted}
          placeholder={getPlaceholder()}
        />
      </main>
    </div>
  );
}

// Map numeric status from backend to string status
function normalizeStatus(status: number | string): string {
  if (typeof status === 'string') return status;
  const statusMap: Record<number, string> = {
    0: RunStatus.Pending,
    1: RunStatus.Running,
    2: RunStatus.WaitingForApproval,
    3: RunStatus.WaitingInput,
    4: RunStatus.Completed,
    5: RunStatus.Failed,
    6: RunStatus.Cancelled,
  };
  return statusMap[status] ?? RunStatus.Pending;
}

interface StatusConfig {
  icon: React.ReactNode;
  colors: string;
  label: string;
}

function StatusBadge({ status }: { status: string | number }) {
  const normalizedStatus = normalizeStatus(status);
  
  const config: Record<string, StatusConfig> = {
    [RunStatus.Pending]: {
      icon: <Clock className="w-3 h-3" />,
      colors: 'bg-gray-600/50 text-gray-300 border-gray-500/50',
      label: 'Pending',
    },
    [RunStatus.Running]: {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      colors: 'bg-blue-600/20 text-blue-300 border-blue-500/50',
      label: 'Running',
    },
    [RunStatus.WaitingForApproval]: {
      icon: <ShieldAlert className="w-3 h-3" />,
      colors: 'bg-amber-600/20 text-amber-300 border-amber-500/50',
      label: 'Awaiting Approval',
    },
    [RunStatus.WaitingInput]: {
      icon: <MessageCircle className="w-3 h-3" />,
      colors: 'bg-purple-600/20 text-purple-300 border-purple-500/50',
      label: 'Ready',
    },
    [RunStatus.Completed]: {
      icon: <CheckCircle className="w-3 h-3" />,
      colors: 'bg-green-600/20 text-green-300 border-green-500/50',
      label: 'Completed',
    },
    [RunStatus.Failed]: {
      icon: <XCircle className="w-3 h-3" />,
      colors: 'bg-red-600/20 text-red-300 border-red-500/50',
      label: 'Failed',
    },
    [RunStatus.Cancelled]: {
      icon: <Ban className="w-3 h-3" />,
      colors: 'bg-gray-600/50 text-gray-300 border-gray-500/50',
      label: 'Cancelled',
    },
  };

  const statusConfig = config[normalizedStatus] ?? config[RunStatus.Pending];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.colors}`}
      role="status"
      aria-label={`Run status: ${statusConfig.label}`}
    >
      {statusConfig.icon}
      <span className="hidden sm:inline">{statusConfig.label}</span>
    </span>
  );
}
