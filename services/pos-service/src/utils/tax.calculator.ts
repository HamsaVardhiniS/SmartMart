export const calculateTax = (price: number, taxPercent: number) => {
  return (price * taxPercent) / 100;
};