import React, { useState } from 'react';
import { seedEvents, seedSingleEvent, clearAllEvents, SAMPLE_EVENTS } from './seedEventData';

/**
 * Event Data Seeder Component
 * 
 * A utility component for seeding test event data into the system.
 * This component provides a UI to:
 * - Seed all sample events
 * - Seed individual events
 * - Clear all events
 * - View sample event data
 * 
 * Usage:
 * Import and render this component in your admin panel or development tools
 * 
 * Example:
 * import EventDataSeeder from './utils/EventDataSeeder';
 * <EventDataSeeder />
 */
const EventDataSeeder = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleSeedAll = async () => {
    if (!window.confirm(`Are you sure you want to seed ${SAMPLE_EVENTS.length} events?`)) {
      return;
    }

    setLoading(true);
    setResults(null);
    try {
      const result = await seedEvents();
      setResults(result);
    } catch (error) {
      setResults({
        total: SAMPLE_EVENTS.length,
        success: 0,
        failed: SAMPLE_EVENTS.length,
        errors: [error.message]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedSingle = async (event) => {
    if (!window.confirm(`Create event: "${event.title}"?`)) {
      return;
    }

    setLoading(true);
    setResults(null);
    try {
      await seedSingleEvent(event);
      setResults({
        total: 1,
        success: 1,
        failed: 0,
        errors: []
      });
    } catch (error) {
      setResults({
        total: 1,
        success: 0,
        failed: 1,
        errors: [error.message]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('⚠️ WARNING: This will delete ALL events in the system. Are you sure?')) {
      return;
    }

    if (!window.confirm('This action cannot be undone. Continue?')) {
      return;
    }

    setLoading(true);
    setResults(null);
    try {
      const result = await clearAllEvents();
      setResults(result);
    } catch (error) {
      setResults({
        total: 0,
        success: 0,
        failed: 0,
        errors: [error.message]
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = ['Active', 'Inactive', 'Cancelled', 'Completed'];
    return labels[status] || 'Unknown';
  };

  const getStatusColor = (status) => {
    const colors = {
      0: '#10b981', // Active - green
      1: '#6b7280', // Inactive - gray
      2: '#ef4444', // Cancelled - red
      3: '#3b82f6'  // Completed - blue
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🌱 Event Data Seeder</h2>
        <p style={styles.subtitle}>
          Utility tool for seeding test event data into the system
        </p>
      </div>

      {/* Action Buttons */}
      <div style={styles.actions}>
        <button
          onClick={handleSeedAll}
          disabled={loading}
          style={{ ...styles.button, ...styles.primaryButton }}
        >
          {loading ? '⏳ Seeding...' : `🌱 Seed All Events (${SAMPLE_EVENTS.length})`}
        </button>
        <button
          onClick={handleClearAll}
          disabled={loading}
          style={{ ...styles.button, ...styles.dangerButton }}
        >
          {loading ? '⏳ Clearing...' : '🗑️ Clear All Events'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div style={styles.results}>
          <h3 style={styles.resultsTitle}>📊 Results</h3>
          <div style={styles.resultStats}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Total:</span>
              <span style={styles.statValue}>{results.total}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>✅ Success:</span>
              <span style={{ ...styles.statValue, color: '#10b981' }}>{results.success}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>❌ Failed:</span>
              <span style={{ ...styles.statValue, color: '#ef4444' }}>{results.failed}</span>
            </div>
          </div>
          {results.errors && results.errors.length > 0 && (
            <div style={styles.errors}>
              <h4 style={styles.errorsTitle}>⚠️ Errors:</h4>
              <ul style={styles.errorList}>
                {results.errors.map((error, index) => (
                  <li key={index} style={styles.errorItem}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Sample Events List */}
      <div style={styles.eventsList}>
        <h3 style={styles.eventsTitle}>📋 Sample Events ({SAMPLE_EVENTS.length})</h3>
        <div style={styles.eventsGrid}>
          {SAMPLE_EVENTS.map((event, index) => (
            <div
              key={index}
              style={styles.eventCard}
              onClick={() => setSelectedEvent(selectedEvent === index ? null : index)}
            >
              <div style={styles.eventHeader}>
                <h4 style={styles.eventTitle}>{event.title}</h4>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(event.status)
                  }}
                >
                  {getStatusLabel(event.status)}
                </span>
              </div>
              <p style={styles.eventLocation}>📍 {event.location}</p>
              <p style={styles.eventDate}>
                📅 {new Date(event.startDate).toLocaleDateString()}
              </p>
              {event.recurrenceRule && (
                <p style={styles.eventRecurrence}>🔄 {event.recurrenceRule}</p>
              )}
              {selectedEvent === index && (
                <div style={styles.eventDetails}>
                  <p style={styles.eventDescription}>{event.description}</p>
                  <p style={styles.eventMeta}>
                    <strong>Visibility:</strong> {event.visibility ? 'Public' : 'Private'}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSeedSingle(event);
                    }}
                    disabled={loading}
                    style={{ ...styles.button, ...styles.secondaryButton, marginTop: '10px' }}
                  >
                    Create This Event
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div style={styles.instructions}>
        <h3 style={styles.instructionsTitle}>📖 Instructions</h3>
        <ol style={styles.instructionsList}>
          <li>Click "Seed All Events" to create all {SAMPLE_EVENTS.length} sample events</li>
          <li>Click on individual event cards to view details and create them one by one</li>
          <li>Use "Clear All Events" to remove all events from the system (use with caution!)</li>
          <li>Make sure you're logged in as an Admin before seeding data</li>
        </ol>
      </div>
    </div>
  );
};

// Inline styles
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '10px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280'
  },
  actions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap'
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '200px'
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white'
  },
  secondaryButton: {
    backgroundColor: '#10b981',
    color: 'white'
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    color: 'white'
  },
  results: {
    backgroundColor: '#f3f4f6',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px'
  },
  resultsTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#1f2937'
  },
  resultStats: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  statItem: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280'
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937'
  },
  errors: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#fee2e2',
    borderRadius: '6px'
  },
  errorsTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: '10px'
  },
  errorList: {
    margin: 0,
    paddingLeft: '20px'
  },
  errorItem: {
    color: '#991b1b',
    fontSize: '14px',
    marginBottom: '5px'
  },
  eventsList: {
    marginBottom: '30px'
  },
  eventsTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#1f2937'
  },
  eventsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '15px'
  },
  eventCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
    gap: '10px'
  },
  eventTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
    flex: 1
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    whiteSpace: 'nowrap'
  },
  eventLocation: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '5px 0'
  },
  eventDate: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '5px 0'
  },
  eventRecurrence: {
    fontSize: '12px',
    color: '#3b82f6',
    margin: '5px 0',
    fontStyle: 'italic'
  },
  eventDetails: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #e5e7eb'
  },
  eventDescription: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.5',
    marginBottom: '10px'
  },
  eventMeta: {
    fontSize: '13px',
    color: '#6b7280'
  },
  instructions: {
    backgroundColor: '#eff6ff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #bfdbfe'
  },
  instructionsTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: '10px'
  },
  instructionsList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#1e40af'
  }
};

export default EventDataSeeder;

