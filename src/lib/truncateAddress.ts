export const truncateAddress = (str: string, front: number = 6, back: number = 6) => {
  if (!str) return "";
  if (str.length <= front + back + 3) return str;
  return `${str.slice(0, front)}...${str.slice(-back)}`;
};