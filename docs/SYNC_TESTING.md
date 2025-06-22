# Sync Integration Testing Guide

This guide explains how to run and understand the synchronization integration tests for the POS system.

## Overview

The sync integration tests verify that PouchDB successfully synchronizes data with CouchDB in various scenarios:

- Basic sync operations (local → remote, remote → local, bidirectional)
- Bulk data synchronization
- Error handling and recovery
- Live sync monitoring
- Performance under load
- Conflict resolution strategies

## Prerequisites

### 1. CouchDB Instance

You need a running CouchDB instance. You can start one with Docker:

```bash
# Start CouchDB with Docker
docker run -d \
  --name couchdb-test \
  -p 5984:5984 \
  -e COUCHDB_USER=admin \
  -e COUCHDB_PASSWORD=admin \
  apache/couchdb:3.3
```

### 2. Environment Variables

Set the following environment variables (or create a `.env.test` file):

```bash
VITE_COUCHDB_URL=http://localhost:5984
VITE_COUCHDB_USERNAME=admin
VITE_COUCHDB_PASSWORD=admin
VITE_SYNCING=true
```

## Running Tests

### Quick Start

```bash
# Run basic sync tests
npm run test:sync

# Run integration tests
npm run test:sync:integration

# Run all sync tests
npm run test:sync:all
```

### Manual Test Execution

```bash
# Run specific test file
npm run test -- src/test/sync-basic.test.ts

# Run with coverage
npm run test:coverage -- src/test/sync-basic.test.ts

# Run in watch mode for development
npm run test:watch -- src/test/sync-basic.test.ts
```

### Using the Test Script

The `scripts/test-sync.sh` script provides additional functionality:

```bash
# Run with custom options
./scripts/test-sync.sh basic --no-cleanup

# Get help
./scripts/test-sync.sh --help
```

Options:
- `basic` - Run basic sync tests (default)
- `integration` - Run integration tests
- `all` - Run all sync tests
- `--no-cleanup` - Skip database cleanup

## Test Categories

### 1. Basic Sync Operations (`sync-basic.test.ts`)

Tests fundamental sync functionality:

- **Single document sync**: Verify documents sync correctly between local and remote
- **Bidirectional sync**: Ensure both directions work simultaneously
- **Bulk operations**: Test syncing multiple documents efficiently
- **Error handling**: Verify graceful handling of connection failures
- **Event monitoring**: Check that sync events are emitted correctly
- **Live sync**: Test real-time synchronization
- **Database statistics**: Verify sync metrics are accurate

### 2. Integration Tests (`sync-integration.test.ts`)

Tests advanced sync scenarios:

- **Conflict resolution**: Test different conflict resolution strategies
- **Concurrent operations**: Multiple simultaneous sync operations
- **Network interruption recovery**: Handling connection failures
- **Performance under load**: Large-scale sync operations
- **Service integration**: Integration with SyncService and SyncManager

## Test Data

The tests create temporary databases with the prefix `test_pos_sync_` followed by a timestamp. This ensures:

- Test isolation
- No interference with production data
- Automatic cleanup

Example test database names:
- `test_pos_sync_products_1640995200000`
- `test_pos_sync_customers_1640995200001`

## Understanding Test Results

### Successful Test Output

```
✅ should sync product from local to remote
✅ should sync customer from remote to local
✅ should perform bidirectional sync
✅ should sync multiple products efficiently
Synced 20 products in 1247ms
```

### Performance Metrics

The tests include performance assertions:

```typescript
// Sync should complete within 5 seconds for 20 documents
expect(syncDuration).toBeLessThan(5000);

// Average time per document should be reasonable
expect(avgTimePerDoc).toBeLessThan(100);
```

### Error Scenarios

Tests verify proper error handling:

```typescript
// Should handle invalid remote database gracefully
await expect(syncToInvalidDB).rejects.toBeDefined();

// Local database should remain intact after errors
const localDoc = await localDB.get(testDoc._id);
expect(localDoc._id).toBe(testDoc._id);
```

## Test Configuration

### Timeouts

Live sync tests use timeouts to avoid hanging:

```typescript
// Maximum wait time for live sync changes
const timeout = setTimeout(resolve, 2000);
```

### Database Cleanup

Tests automatically clean up after themselves:

```typescript
afterEach(async () => {
  try {
    await localDB.destroy();
    await remoteDB.destroy();
  } catch {
    // Ignore cleanup errors
  }
});
```

## Troubleshooting

### CouchDB Connection Issues

**Problem**: Tests fail with connection errors

**Solutions**:
1. Verify CouchDB is running: `curl http://localhost:5984`
2. Check environment variables are set correctly
3. Ensure no firewall blocking port 5984
4. Verify credentials are correct

### Test Database Conflicts

**Problem**: Tests fail due to existing databases

**Solutions**:
1. Run cleanup manually: `./scripts/test-sync.sh --cleanup-only`
2. Use different database prefix in test configuration
3. Restart CouchDB to clear all databases

### Performance Test Failures

**Problem**: Tests fail performance assertions

**Solutions**:
1. Check system resources (CPU, memory)
2. Ensure CouchDB is running locally (not remote)
3. Reduce test data size for slower systems
4. Increase timeout values if necessary

### Network Simulation

**Problem**: Network failure tests don't work

**Solutions**:
1. Ensure `fetch` is properly mocked in test environment
2. Check that network failure simulation is active
3. Verify retry logic is enabled in test configuration

## Extending Tests

### Adding New Test Cases

1. Create test in appropriate file:

```typescript
it('should handle custom sync scenario', async () => {
  // Test implementation
});
```

2. Follow existing patterns:
   - Use descriptive test names
   - Clean up resources
   - Include performance assertions
   - Test both success and failure cases

### Adding New Test Categories

1. Create new test file: `src/test/sync-[category].test.ts`
2. Add to test script: `scripts/test-sync.sh`
3. Update package.json scripts
4. Document in this guide

## Performance Benchmarks

Target performance metrics:

- **Single document sync**: < 100ms
- **10 documents**: < 500ms
- **50 documents**: < 2000ms
- **100 documents**: < 5000ms

These can be adjusted based on your infrastructure requirements.

## CI/CD Integration

For continuous integration, add to your pipeline:

```yaml
# GitHub Actions example
- name: Start CouchDB
  run: docker run -d -p 5984:5984 -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=admin apache/couchdb:3.3

- name: Wait for CouchDB
  run: until curl -s http://localhost:5984; do sleep 1; done

- name: Run Sync Tests
  run: npm run test:sync:all
  env:
    VITE_COUCHDB_URL: http://localhost:5984
    VITE_COUCHDB_USERNAME: admin
    VITE_COUCHDB_PASSWORD: admin
```

## Best Practices

1. **Isolated Tests**: Each test should be independent
2. **Cleanup**: Always clean up test databases
3. **Realistic Data**: Use representative test data
4. **Error Testing**: Test failure scenarios thoroughly
5. **Performance**: Include performance assertions
6. **Documentation**: Document complex test scenarios

## Related Documentation

- [SYNCING.md](../docs/SYNCING.md) - Sync architecture overview
- [README.md](../README.md) - Project setup and configuration
- [ERROR_HANDLING.md](../docs/ERROR_HANDLING.md) - Error handling strategies
