# Database Synchronization Strategy

This document outlines the synchronization strategy between local PouchDB instances and remote CouchDB databases in the POS system.

## Overview

The POS system uses an **offline-first architecture** with bidirectional synchronization for master data (products, customers, operators) and unidirectional synchronization for transactional data (orders). This ensures the system remains functional even when network connectivity is intermittent.

## Synchronization Configuration

### Environment Variables

```bash
VITE_ENABLE_SYNC=true                    # Enable/disable sync globally
VITE_COUCHDB_URL=http://localhost:5984   # CouchDB server URL
VITE_COUCHDB_USERNAME=admin              # CouchDB username
VITE_COUCHDB_PASSWORD=password           # CouchDB password
```

### Database-Specific Sync Strategies

## 📦 Products Database

**Strategy**: Two-way synchronization with conflict resolution

### Sync Behavior

- **Direction**: Bidirectional (local ↔ remote)
- **Frequency**: Real-time with live sync enabled
- **Indexes**: Barcode field indexed for fast lookups

### Conflict Resolution

- **Product details** (name, price, sku, barcode, description, prescription, active_ingredient):
  - **Strategy**: Remote wins (accept remote changes)
  - **Rationale**: Central inventory management should be authoritative
- **Stock levels**:
  - **Strategy**: Defer to order sync completion
  - **Process**:
    1. Orders sync to remote first
    2. Remote system updates stock levels based on all terminal transactions
    3. Local pulls updated stock levels from remote

### Implementation Status

```typescript
// Current: Basic two-way sync implemented
// TODO: Implement stock-specific conflict resolution
// TODO: Add retry logic for failed syncs
```

## 👥 Customers Database

**Strategy**: Two-way synchronization with timestamp-based conflict resolution

### Sync Behavior

- **Direction**: Bidirectional (local ↔ remote)
- **Frequency**: Real-time with live sync enabled
- **Conflict Resolution**: Most recent update wins (last-write-wins with `_rev` comparison)

### Use Cases

- Customer information updates from any terminal
- Purchase history aggregation across all terminals
- Loyalty program data synchronization

## 👤 Operators Database

**Strategy**: Two-way synchronization with security considerations

### Sync Behavior

- **Direction**: Bidirectional (local ↔ remote)
- **Frequency**: Real-time with live sync enabled
- **Conflict Resolution**: Most recent update wins

### Security Notes

- Password hashes only (never plain text)
- Permission changes propagate immediately to all terminals
- Consider implementing operator session management

## 🧾 Orders Database

**Strategy**: One-way synchronization (local → remote only)

### Sync Behavior

- **Direction**: Unidirectional (local → remote only)
- **Frequency**: Real-time push on order completion
- **Local Cleanup**: Purge order history after successful remote sync

### Business Logic

- Orders are created and completed locally
- Only push completed orders to remote
- Never pull remote orders to local terminals
- Remote system aggregates all terminal data for reporting

### Implementation Status

```typescript
// Current: Basic push sync implemented
// TODO: Implement order purging after successful sync
// TODO: Add batch sync for offline order queues
// TODO: Implement retry logic with exponential backoff
```

## 🔄 Sync States and Error Handling

### Connection States

- **Online + Sync Enabled**: Full bidirectional sync active
- **Online + Sync Disabled**: Local-only mode (manual sync required)
- **Offline**: Queue changes locally, sync when reconnected

### Error Scenarios

1. **Network Interruption**: Queue changes, retry on reconnection
2. **Conflict Resolution Failure**: Log error, notify user, fallback to remote
3. **Authentication Failure**: Disable sync, notify administrator
4. **Database Corruption**: Trigger full resync from remote

## 🚀 Implementation Guidelines

### Database Initialization

```typescript
// Each database follows this pattern:
const db = new PouchDB("database_name");
db.createIndex({ index: { fields: ["indexed_field"] } });

if (SYNCING) {
  const remoteDB = new PouchDB(`${COUCHDB_URL}/database_name`, {
    auth: { username, password },
  });

  remoteDB.sync(db, {
    live: true,
    retry: true,
    // Database-specific options
  });
}
```

### Sync Status Monitoring

- Use `useOnlineStatusStore()` to monitor connection state
- Implement sync progress indicators in UI
- Log sync events for debugging and monitoring

## 📋 Current TODOs and Improvements

### High Priority

- [ ] Implement order purging after successful remote sync
- [ ] Add stock-level conflict resolution for products
- [ ] Implement retry logic with exponential backoff
- [ ] Add batch sync for queued offline orders

### Medium Priority

- [ ] Add sync progress indicators in UI
- [ ] Implement sync event logging and monitoring
- [ ] Add manual sync triggers for administrators
- [ ] Optimize sync filters to reduce bandwidth

### Low Priority

- [ ] Implement selective sync (sync only changed documents)
- [ ] Add compression for large document sync
- [ ] Implement sync analytics and reporting

## 🔧 Troubleshooting

### Common Issues

1. **Sync appears stuck**: Check network connectivity and CouchDB server status
2. **Conflicts not resolving**: Verify conflict resolution strategies are implemented
3. **Orders not syncing**: Ensure orders have status 'COMPLETED' before sync
4. **High bandwidth usage**: Implement selective sync and document filtering

### Debug Tools

- Enable debug mode: `VITE_ENABLE_DEBUG_MODE=true`
- Monitor sync events in browser developer tools
- Check CouchDB logs for server-side issues
- Use PouchDB debug plugin for detailed sync logging

## 📚 Related Documentation

- [Error Handling](./ERROR_HANDLING.md)
- [Recommendation System](./RECOMMENDATION_SYSTEM.md)
- [Environment Configuration](../scripts/validate-env.mjs)
