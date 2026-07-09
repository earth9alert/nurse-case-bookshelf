import { useStorageStatus } from '../hooks/useStorageStatus'

interface StorageStatusBadgeProps {
  isInitialized: boolean
}

export function StorageStatusBadge({ isInitialized }: StorageStatusBadgeProps) {
  const status = useStorageStatus(isInitialized)

  return (
    <div
      className="storage-status-badge"
      style={{
        background: status.color,
        color: 'white',
      }}
      title={status.label}
    >
      <span className="storage-status-badge__icon">{status.icon}</span>
      <span className="storage-status-badge__label">{status.label}</span>
    </div>
  )
}
