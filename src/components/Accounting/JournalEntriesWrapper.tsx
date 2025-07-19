import React from 'react';
import { EnhancedJournalEntriesTab } from './EnhancedJournalEntriesTab';

// Simple wrapper to force re-mount and clear any cached React Query state
export const JournalEntriesWrapper: React.FC = () => {
  return <EnhancedJournalEntriesTab key="fresh-mount" />;
};