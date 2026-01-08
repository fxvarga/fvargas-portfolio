import type { RunEvent } from '@/types';

type EventHandler = (event: RunEvent) => void;

/**
 * SSE (Server-Sent Events) client for real-time run updates.
 * Uses the native EventSource API for efficient server push.
 */
class SSEConnection {
  private eventSource: EventSource | null = null;
  private currentRunId: string | null = null;
  private eventHandler: EventHandler | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  /**
   * Connect to SSE stream for a specific run
   */
  connect(runId: string, onEvent: EventHandler): void {
    // Close existing connection if different run
    if (this.currentRunId && this.currentRunId !== runId) {
      this.disconnect();
    }

    // Already connected to this run
    if (this.eventSource && this.currentRunId === runId) {
      return;
    }

    this.currentRunId = runId;
    this.eventHandler = onEvent;
    this.reconnectAttempts = 0;

    this.createConnection();
  }

  private createConnection(): void {
    if (!this.currentRunId) return;

    // EventSource automatically includes cookies for auth
    const url = `/api/runs/${this.currentRunId}/events`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log(`[SSE] Connected to run: ${this.currentRunId}`);
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RunEvent;
        this.eventHandler?.(data);
      } catch (error) {
        console.error('[SSE] Failed to parse event:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      
      // EventSource will automatically reconnect for some errors,
      // but we handle explicit reconnection for others
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.handleDisconnect();
      }
    };
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SSE] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.createConnection();
    }, delay);
  }

  /**
   * Disconnect from current SSE stream
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log(`[SSE] Disconnected from run: ${this.currentRunId}`);
    }

    this.currentRunId = null;
    this.eventHandler = null;
    this.reconnectAttempts = 0;
  }

  get isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  get connectedRunId(): string | null {
    return this.currentRunId;
  }
}

// Singleton instance
export const sseConnection = new SSEConnection();
