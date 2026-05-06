export const safeNumber = (val: any, fallback = 0) => {
  const num = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(num) ? fallback : num;
};

export const formatKcal = (val: any) => `${Math.round(safeNumber(val))} calorias`;

export const formatMacro = (val: any) => `${Math.round(safeNumber(val))}g`;

export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const main = document.querySelector('main');

  if (main) {
    main.scrollTo({ top: 0, behavior: 'smooth' });
  }
};