function breakEven(fixed, price, cost) {
  const contribution = price - cost;
  if (contribution <= 0) return Infinity; // unreachable
  return Math.ceil(fixed / contribution);
}
console.log(breakEven(20, 4.0, 1.5));   // predict
console.log(breakEven(45, 2.8, 3.0));   // and this one?