# 🚀 @ilniqjs/least v3.0

Ultra‑optimized, production‑ready React framework for state management, HTTP, caching, forms, and performance utilities — built with **zero dependencies**, **100% TypeScript**, and ** reliability**.

---

## ✨ Key Features

* ✅ **~25KB gzipped**
* ✅ **Zero dependencies** (React only as peer)
* ✅ **100% TypeScript**
* ✅ **Memory‑safe** (automatic cleanup)
* ✅ **SSR compatible** (Next.js, Remix)
* ✅ **Redux DevTools support**
* ✅ **LRU caching with TTL**
* ✅ **Async‑safe batching**
* ✅ **Lifecycle‑safe forms**
* ✅ **Production benchmarks included**

---

## 📦 Installation

```bash
npm install @ilniqjs/least
```

Peer dependency:

```bash
npm install react react-dom
```

---

## 🔧 Quick Start

### 1. Create a Store

```ts
import { createStore, useStore } from '@ilniqjs/least';

const counterStore = createStore({
  initialState: { count: 0 },
  name: 'counter'
});
```

### 2. Use in a Component

```tsx
function Counter() {
  const count = useStore(counterStore, s => s.count);

  return (
    <button onClick={() => counterStore.setState({ count: count + 1 })}>
      Count: {count}
    </button>
  );
}
```

---

## 🧠 State Management

### Create Store

```ts
createStore<T>({
  initialState: T,
  name?: string,
  devtools?: boolean
});
```

### Store API

```ts
store.getState();
store.setState(partial);
store.subscribe(listener);
store.destroy();
```

### Async‑Safe Batching

```ts
import { batch, batchAsync } from '@ilniqjs/least';

batch(() => {
  store.setState({ a: 1 });
  store.setState({ b: 2 });
});
```

```ts
await batchAsync(async () => {
  await apiCall();
  store.setState({ ready: true });
});
```

---

## 💾 Persisted Stores

```ts
import { createPersistedStore } from '@ilniqjs/least';

const settingsStore = createPersistedStore(
  { initialState: { theme: 'light' } },
  {
    key: 'app-settings',
    version: 1,
    throttleMs: 1000,
    migrate: (old) => old
  }
);
```

---

## 🌐 HTTP Client

```ts
import { createHttpClient } from '@ilniqjs/least';

const http = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  retries: 2
});

const { data } = await http.get('/users');
```

### Features

* ✅ Automatic retries
* ✅ Request cancellation
* ✅ Interceptors
* ✅ Safe JSON parsing
* ✅ Timeout handling

---

## 🗃️ Caching (LRU + TTL)

```ts
import { createCache } from '@ilniqjs/least';

const cache = createCache({
  maxSize: 5 * 1024 * 1024,
  maxEntries: 100
});

cache.set('user:1', user, 60000);
const user = cache.get('user:1');
```

### Cache Stats

```ts
cache.getStats();
```

---

## 📝 Forms & Validation

### Create Control

```ts
import { createFormControl, Validators } from '@ilniqjs/least';

const email = createFormControl('', [
  Validators.required(),
  Validators.email()
]);
```

### Use in Component

```tsx
import { useFormControl } from '@ilniqjs/least';

function EmailInput() {
  const { value, setValue, error, touched, markTouched } = useFormControl(email);

  return (
    <div>
      <input value={value} onChange={e => setValue(e.target.value)} onBlur={markTouched} />
      {touched && error && <span>{error}</span>}
    </div>
  );
}
```

### Form Groups

```ts
import { createFormGroup } from '@ilniqjs/least';

const form = createFormGroup({
  email,
  password
});
```

---

## 🛠 Utilities

* `debounce(fn, ms)`
* `throttle(fn, ms)`
* `memoize(fn)`
* `shallowEqual(a, b)`
* `deepEqual(a, b)`
* `isClient`, `isServer`

---

## 🧪 Testing

```bash
npm test
```

Includes:

* Store tests
* HTTP client tests
* Cache tests
* Forms tests

---

## ⚡ Benchmarks

```bash
npm run bench
```

Typical results:

* 10k store updates: ~45ms
* Batched updates: ~8ms
* 1k subscribers notify: ~12ms

---

## 📊 Bundle Size

```bash
npm run size
```

Target: **≤ 25KB gzipped**

---

## ⚙️ SSR Compatibility

Fully compatible with:

* ✅ Next.js
* ✅ Remix
* ✅ Vite SSR

No usage of `window` or `document` during module initialization.

---

## ✅ Production Checklist

* [ ] Build successful
* [ ] Tests passing
* [ ] No memory leaks
* [ ] Cache limits configured
* [ ] Error boundaries added
* [ ] Loading states implemented
* [ ] DevTools disabled in prod

---

## 🐛 Troubleshooting

### Store destroyed error

```ts
useEffect(() => () => store.destroy(), []);
```

### Memory growth

```ts
cache.getStats();
```

### Form not validating

```ts
createFormControl('', validators, 'blur');
```

---

## 📜 License

MIT License

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Add tests
4. Submit PR

---

## 🎉 You're Ready

You now have a **high‑performance, production‑ready React framework** with:

*  state
* Safe async handling
* Built‑in caching
* Type‑safe forms
* Optimized HTTP

Happy c
