/**
 * RTL (Right-to-Left) utility functions for Arabic interface
 */

export const isRTL = () => {
  return document.documentElement.dir === 'rtl';
};

export const setDirection = (direction: 'rtl' | 'ltr') => {
  document.documentElement.dir = direction;
  document.documentElement.lang = direction === 'rtl' ? 'ar' : 'en';
};

export const toggleDirection = () => {
  const currentDir = document.documentElement.dir;
  setDirection(currentDir === 'rtl' ? 'ltr' : 'rtl');
};
