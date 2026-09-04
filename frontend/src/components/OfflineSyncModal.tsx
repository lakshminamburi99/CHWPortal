import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { offlineSyncService, type SyncState, type QueuedMutation } from '../services/offlineSync';

export const OfflineSyncModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [syncState, setSyncState] = useState<SyncState>(offlineSyncService.getState());
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = offlineSyncService.subscribe(state => {
      setSyncState(state);
    });
    return unsub;
  }, []);

  const handleManualSync = async () => {
    const result = await offlineSyncService.syncOutbox();
    if (result.successCount > 0) {
      setSyncResultMsg(`Successfully synced ${result.successCount} item(s) to server database.`);
    } else if (result.failCount > 0) {
      setSyncResultMsg(`Failed to sync ${result.failCount} item(s). Check network connectivity.`);
    } else {
      setSyncResultMsg('Outbox is clean. All records are up to date.');
    }
    setTimeout(() => setSyncResultMsg(null), 4000);
  };

  const isEffectiveOnline = syncState.isOnline && !syncState.isSimulatedOffline;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📶 Offline Outbox & Field Sync Manager">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Connectivity Status Header Card */}
        <div style={{
          background: isEffectiveOnline
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.04) 100%)'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(185, 28, 28, 0.04) 100%)',
          border: `1px solid ${isEffectiveOnline ? '#10b981' : '#ef4444'}`,
          borderRadius: '10px',
          padding: '1rem 1.25rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{isEffectiveOnline ? '🟢' : '🔴'}</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                  {isEffectiveOnline ? 'Online · Connected to Care Engine' : 'Offline Mode · Queuing to Local Outbox'}
                </h4>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  {syncState.isSimulatedOffline
                    ? '⚠️ Simulated Offline Mode active for field resilience testing.'
                    : syncState.isOnline
                    ? 'Mutations are transmitted immediately or auto-synced upon flush.'
                    : 'Physical network connection is unreachable. Assessments are saved securely in browser storage.'}
                </p>
              </div>
            </div>

            <Badge variant={isEffectiveOnline ? 'success' : 'danger'}>
              {syncState.pendingCount} Pending Sync
            </Badge>
          </div>

          {/* Sync Controls Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.85rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
              Last Synced: <strong>{syncState.lastSyncedAt || 'Never this session'}</strong>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                size="sm"
                variant={syncState.isSimulatedOffline ? 'danger' : 'outline'}
                onClick={() => offlineSyncService.setSimulatedOffline(!syncState.isSimulatedOffline)}
                style={{ fontSize: '0.75rem' }}
              >
                {syncState.isSimulatedOffline ? '🔌 Disable Offline Sim' : '⚡ Simulate Offline Mode'}
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleManualSync}
                disabled={syncState.isSyncing || !isEffectiveOnline || syncState.pendingCount === 0}
                style={{ fontSize: '0.75rem', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
              >
                {syncState.isSyncing ? '⏳ Syncing...' : '🔄 Flush Outbox Now'}
              </Button>
            </div>
          </div>
        </div>

        {syncResultMsg && (
          <div style={{
            background: 'var(--muted)',
            padding: '0.6rem 0.9rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 600,
            borderLeft: '4px solid #0284c7',
          }}>
            {syncResultMsg}
          </div>
        )}

        {/* Queued Items List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
              Outbox Mutation Log ({syncState.items.length} total)
            </h5>
            {syncState.items.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button size="sm" variant="outline" onClick={() => offlineSyncService.clearSynced()} style={{ fontSize: '0.7rem' }}>
                  Clear Synced
                </Button>
                <Button size="sm" variant="outline" onClick={() => offlineSyncService.clearAll()} style={{ fontSize: '0.7rem', color: '#ef4444' }}>
                  Purge All
                </Button>
              </div>
            )}
          </div>

          {syncState.items.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2.5rem 1rem',
              background: 'var(--muted)',
              borderRadius: '8px',
              color: 'var(--muted-foreground)',
              fontSize: '0.85rem',
            }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>✨</span>
              Outbox is currently empty. All field clinical data is fully synchronized with central servers.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
              {syncState.items.map((item: QueuedMutation) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: item.status === 'SYNCED' ? 'rgba(16, 185, 129, 0.05)' : 'var(--card)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Badge variant={
                        item.status === 'SYNCED' ? 'success' :
                        item.status === 'SYNCING' ? 'info' :
                        item.status === 'FAILED' ? 'danger' : 'warning'
                      }>
                        {item.status}
                      </Badge>
                      <strong style={{ fontSize: '0.85rem' }}>{item.previewLabel}</strong>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      Endpoint: <code>{item.method} {item.endpoint}</code> · Queued: {new Date(item.queuedAt).toLocaleTimeString()}
                    </span>
                    {item.lastError && (
                      <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>
                        ⚠️ Error: {item.lastError} (Retries: {item.retryCount})
                      </span>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => offlineSyncService.removeMutation(item.id)}
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
