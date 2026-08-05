import * as React from 'react';

/**
 * A wrapper around React.lazy that handles chunk load errors by forcing a page reload.
 * This is useful for Single Page Applications when a new deployment happens and old chunks are missing.
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
    } catch (error) {
      console.error("Chunk load error detected, reloading page...", error);
      
      // Use local storage to prevent infinite reload loops
      const lastReload = localStorage.getItem('last-chunk-reload');
      const now = Date.now();
      
      // Only reload if we haven't reloaded in the last 10 seconds
      if (!lastReload || now - parseInt(lastReload) > 10000) {
        localStorage.setItem('last-chunk-reload', now.toString());
        window.location.reload();
      }
      
      throw error;
    }
  });
};
