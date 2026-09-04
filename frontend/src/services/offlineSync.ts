import { API_BASE } from '../config';

export type MutationType =
  | 'SUBMIT_ASSESSMENT'
  | 'CREATE_PATIENT'
  | 'SCHEDULE_FOLLOW_UP'
  | 'UPDATE_PATIENT_STATUS'
  | 'RECORD_VITALS';

export interface QueuedMutation {
  id: string;
  type: MutationType;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  previewLabel: string;
  patientName?: string;
  queuedAt: string;
  retryCount: number;
  lastError?: string;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'SYNCED';
}

export interface SyncState {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  items: QueuedMutation[];
}

const STORAGE_KEY = 'chw_offline_outbox_queue';
const SIMULATED_OFFLINE_KEY = 'chw_simulated_offline';
const LAST_SYNC_KEY = 'chw_last_sync_timestamp';

class OfflineSyncService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSimulatedOffline: boolean = false;
  private isSyncing: boolean = false;
  private listeners: Set<(state: SyncState) => void> = new Set();
  private intervalId: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isSimulatedOffline = localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
        if (!this.isSimulatedOffline) {
          this.syncOutbox();
        }
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });

      // Background auto-retry check every 30 seconds
      this.intervalId = setInterval(() => {
        if (this.effectiveOnlineStatus() && this.getPendingCount() > 0 && !this.isSyncing) {
          this.syncOutbox();
        }
      }, 30000);
    }
  }

  public effectiveOnlineStatus(): boolean {
    return this.isOnline && !this.isSimulatedOffline;
  }

  public setSimulatedOffline(val: boolean) {
    this.isSimulatedOffline = val;
    localStorage.setItem(SIMULATED_OFFLINE_KEY, val ? 'true' : 'false');
    this.notify();
    if (this.effectiveOnlineStatus() && this.getPendingCount() > 0) {
      this.syncOutbox();
    }
  }

  public getItems(): QueuedMutation[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveItems(items: QueuedMutation[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save offline outbox', e);
    }
  }

  public getPendingCount(): number {
    return this.getItems().filter(i => i.status === 'PENDING' || i.status === 'FAILED').length;
  }

  public getState(): SyncState {
    return {
      isOnline: this.isOnline,
      isSimulatedOffline: this.isSimulatedOffline,
      isSyncing: this.isSyncing,
      pendingCount: this.getPendingCount(),
      lastSyncedAt: localStorage.getItem(LAST_SYNC_KEY),
      items: this.getItems(),
    };
  }

  public subscribe(cb: (state: SyncState) => void): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(cb => {
      try {
        cb(state);
      } catch (err) {
        console.error('Error in offline sync listener', err);
      }
    });
  }

  public enqueue(
    type: MutationType,
    endpoint: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    payload: any,
    previewLabel: string,
    patientName?: string
  ): QueuedMutation {
    const items = this.getItems();
    const newMutation: QueuedMutation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      endpoint,
      method,
      payload,
      previewLabel,
      patientName,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
      status: 'PENDING',
    };

    items.unshift(newMutation);
    this.saveItems(items);
    this.notify();

    // Trigger auto-sync if we're connected
    if (this.effectiveOnlineStatus()) {
      setTimeout(() => this.syncOutbox(), 200);
    }

    return newMutation;
  }

  public removeMutation(id: string) {
    const items = this.getItems().filter(i => i.id !== id);
    this.saveItems(items);
    this.notify();
  }

  public clearSynced() {
    const items = this.getItems().filter(i => i.status !== 'SYNCED');
    this.saveItems(items);
    this.notify();
  }

  public clearAll() {
    this.saveItems([]);
    this.notify();
  }

  public async syncOutbox(): Promise<{ successCount: number; failCount: number }> {
    if (this.isSyncing || !this.effectiveOnlineStatus()) {
      return { successCount: 0, failCount: 0 };
    }

    this.isSyncing = true;
    this.notify();

    let items = this.getItems();
    let successCount = 0;
    let failCount = 0;
    const token = localStorage.getItem('access_token');

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === 'SYNCED') continue;

      item.status = 'SYNCING';
      this.saveItems(items);
      this.notify();

      try {
        const url = item.endpoint.startsWith('http') ? item.endpoint : `${API_BASE}${item.endpoint}`;
        const res = await fetch(url, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(item.payload),
        });

        if (res.ok) {
          item.status = 'SYNCED';
          item.lastError = undefined;
          successCount++;
        } else {
          item.status = 'FAILED';
          item.retryCount += 1;
          item.lastError = `Server responded with HTTP ${res.status}`;
          failCount++;
        }
      } catch (err: any) {
        item.status = 'FAILED';
        item.retryCount += 1;
        item.lastError = err?.message || 'Network connection failed during flush';
        failCount++;
      }
    }

    this.isSyncing = false;
    const nowIso = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    localStorage.setItem(LAST_SYNC_KEY, nowIso);
    this.saveItems(items);
    this.notify();

    // Trigger custom window event for pages to refresh their live queries
    if (successCount > 0 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chw_offline_sync_completed', { detail: { count: successCount } }));
    }

    return { successCount, failCount };
  }
}

export const offlineSyncService = new OfflineSyncService();
