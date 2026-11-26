function profit(n) { return 2.5 * n - 20; }
console.assert(profit(8) === 0, "break-even at 8");
console.assert(profit(9) === 2.5, "one past break-even");
console.assert(profit(0) === -20, "no sales = fixed cost loss");
console.log("tests finished");