'use client';

import { useEffect } from 'react';

/**
 * Accessibility Checker Component
 * 
 * This component runs axe-core accessibility tests in development mode
 * and logs violations to the console.
 * 
 * Only active in development mode.
 */

export default function AccessibilityChecker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Dynamically import @axe-core/react only in development
    import('@axe-core/react').then((axe) => {
      import('react').then((React) => {
        import('react-dom').then((ReactDOM) => {
          axe.default(React, ReactDOM, 1000, {
            rules: [
              {
                id: 'color-contrast',
                enabled: true,
              },
              {
                id: 'label',
                enabled: true,
              },
              {
                id: 'button-name',
                enabled: true,
              },
              {
                id: 'link-name',
                enabled: true,
              },
            ],
          });
          console.log('♿ Accessibility checker enabled. Check console for violations.');
        });
      });
    }).catch((err) => {
      console.warn('Failed to load accessibility checker:', err);
    });
  }, []);

  return null;
}

// Export helper function to manually check accessibility
export async function checkAccessibility(element?: Element): Promise<void> {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    const axe = await import('axe-core');
    const target = element || document.body;
    const results = await axe.default.run(target, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      },
    });

    console.group('♿ Accessibility Check Results');
    console.log(`✅ Passes: ${results.passes.length}`);
    console.log(`❌ Violations: ${results.violations.length}`);
    console.log(`⚠️  Incomplete: ${results.incomplete.length}`);

    if (results.violations.length > 0) {
      console.group(`❌ ${results.violations.length} Violations`);
      results.violations.forEach((violation) => {
        console.group(`[${violation.impact}] ${violation.id}`);
        console.log('Description:', violation.description);
        console.log('Help:', violation.help);
        console.log('Help URL:', violation.helpUrl);
        console.log('Affected nodes:', violation.nodes.length);
        violation.nodes.forEach((node, index) => {
          console.log(`  ${index + 1}.`, node.html);
          console.log('     Target:', node.target);
        });
        console.groupEnd();
      });
      console.groupEnd();
    }

    if (results.incomplete.length > 0) {
      console.group(`⚠️  ${results.incomplete.length} Incomplete Checks`);
      results.incomplete.forEach((item) => {
        console.log(`[${item.id}]`, item.description);
      });
      console.groupEnd();
    }

    console.groupEnd();
  } catch (error) {
    console.error('Accessibility check failed:', error);
  }
}

