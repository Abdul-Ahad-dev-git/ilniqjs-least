let batchDepth = 0;
let pendingNotifications = new Set<() => void>();

function flushNotifications(): void {
  const notifications = Array.from(pendingNotifications);
  pendingNotifications.clear();
  notifications.forEach(fn => {
    try {
      fn();
    } catch (error) {
      console.error('[Batch] Notification error:', error);
    }
  });
}

/**
 * Schedule a notification to run immediately or after batch completes
 * @param fn - The notification function to schedule
 */
export function scheduleBatch(fn: () => void): void {
  if (batchDepth === 0) {
    // Not batching, execute immediately
    fn();
  } else {
    // Batching is active, queue for later
    pendingNotifications.add(fn);
  }
}

/**
 * Check if currently batching
 */
export function isBatching(): boolean {
  return batchDepth > 0;
}

function startBatch(): void {
  batchDepth++;
}

function endBatch(): void {
  batchDepth--;
  if (batchDepth === 0 && pendingNotifications.size > 0) {
    flushNotifications();
  }
}

/**
 * Batch multiple state updates into a single notification cycle
 * @param fn - Function containing state updates to batch
 */
export function batch<T>(fn: () => T): T {
  startBatch();
  try {
    const result = fn();
    
    // Handle promises
    if (result instanceof Promise) {
      return result.finally(() => endBatch()) as any;
    }
    
    endBatch();
    return result;
  } catch (error) {
    endBatch();
    throw error;
  }
}

/**
 * Batch async operations
 * @param fn - Async function containing state updates to batch
 */
export async function batchAsync<T>(fn: () => Promise<T>): Promise<T> {
  startBatch();
  try {
    const result = await fn();
    endBatch();
    return result;
  } catch (error) {
    endBatch();
    throw error;
  }
}