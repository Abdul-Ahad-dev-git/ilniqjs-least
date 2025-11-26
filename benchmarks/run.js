const { createStore } = require('../dist/index.js');
const { batch } = require('../dist/index.js');

console.log('🚀 Performance Benchmarks\n');

// Benchmark 1: State Updates
console.log('1. State Updates (10,000 iterations)');
const store1 = createStore({ initialState: { count: 0 } });
const start1 = Date.now();
for (let i = 0; i < 10000; i++) {
  store1.setState({ count: i });
}
const duration1 = Date.now() - start1;
console.log(`   ✓ ${duration1}ms (${(10000 / duration1).toFixed(0)} ops/ms)\n`);

// Benchmark 2: Batched Updates
console.log('2. Batched Updates (10,000 iterations)');
const store2 = createStore({ initialState: { count: 0 } });
const start2 = Date.now();
batch(() => {
  for (let i = 0; i < 10000; i++) {
    store2.setState({ count: i });
  }
});
const duration2 = Date.now() - start2;
console.log(`   ✓ ${duration2}ms (${(10000 / duration2).toFixed(0)} ops/ms)\n`);

// Benchmark 3: Subscribers
console.log('3. Notify 1000 Subscribers');
const store3 = createStore({ initialState: { count: 0 } });
for (let i = 0; i < 1000; i++) {
  store3.subscribe(() => {});
}
const start3 = Date.now();
store3.setState({ count: 1 });
setTimeout(() => {
  const duration3 = Date.now() - start3;
  console.log(`   ✓ ${duration3}ms\n`);
  
  console.log('✅ All benchmarks complete!');
}, 100);