import * as React from 'react';
import { isChunkLoadError, reloadForNewVersion } from './chunkReload';

/**
 * A wrapper around React.lazy that survives chunk load errors. It retries the import once
 * (covers a flaky connection), and if the file is gone because a new version was deployed,
 * it reloads the page to pick up the new build instead of showing an error screen.
 *
 * @param componentImport A function that returns a promise of the component import
 * @returns A React component that lazily loads the wrapped component with retry logic
 */
export const lazyRetry = <T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) => {
  return React.lazy(async () => {
    try {
      return await componentImport();
    } catch (firstError) {
      await new Promise(resolve => setTimeout(resolve, 800));
      try {
        return await componentImport();
      } catch (error) {
        console.error('Chunk load error detected', error);
        if (isChunkLoadError(error) && reloadForNewVersion()) {
          // Keep showing the loading state while the page reloads.
          return new Promise<{ default: T }>(() => {});
        }
        throw error;
      }
    }
  });
};
