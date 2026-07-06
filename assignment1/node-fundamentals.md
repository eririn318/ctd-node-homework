# Node.js Fundamentals

## What is Node.js?
Node.js is a runtime that lets you run JavaScript outside the browser, on your computer or a server.

## How does Node.js differ from running JavaScript in the browser?
Node.js runs JavaScript outside the browser, directly on a computer or server, using the V8 engine without the restrictions browsers place on JavaScript for security. This means Node can access the file system (reading/writing files), start web servers, read environment variables, and interact with operating system services—things browser JavaScript cannot do because it runs in a sandboxed environment. On the other hand, browser JavaScript has access to the DOM (manipulating HTML/CSS on a webpage) and browser-specific APIs like `window`, `document`, and `localStorage`, which Node.js does not have since there's no browser or webpage involved.

## What is the V8 engine, and how does Node use it?
-V8 is a JavaScript engine — a program that takes JavaScript code and actually executes it. It was created by Google, originally to make JavaScript run fast inside the Chrome browser. It's written in C++.
Its main job: it converts JavaScript (which computers can't run directly) into machine code that your computer's processor can actually execute. This process involves parsing your code, compiling it, and optimizing it while it runs (this is called "JIT" — Just-In-Time compilation).

-Node.js takes the V8 engine and embeds it inside a standalone program, separate from any web browser. Then Node.js adds extra features on top of V8 — like the ability to read/write files, create servers, and access the operating system — none of which are things V8 does on its own. V8 alone just runs JavaScript logic (math, loops, functions, etc.); it has no concept of files or servers. Node.js is what wraps V8 and adds those extra "superpowers."

## What are some key use cases for Node.js?
1.Servers and APIs — Since Node can handle many requests at once without blocking (thanks to its non-blocking, event-driven design), it's popular for building web servers and REST APIs (e.g., using frameworks like Express — which I know you've used in your nail booking app backend!).

2.Command-line tools (CLIs) — Node lets you write scripts that run directly from the terminal, doing tasks like file processing, automation, or build tools (e.g., tools like npm itself is built with Node).

3.Real-time applications — Things like chat apps, live notifications, or collaborative tools (e.g., Google Docs-style live editing) benefit from Node's ability to handle many simultaneous connections efficiently, often paired with WebSockets.

4.File and data processing — Since Node has built-in file system access, it's used for reading/writing files, processing logs, or handling data pipelines.

5.Microservices / backend logic — Many companies use Node for lightweight backend services that talk to databases, other APIs, or each other.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

**CommonJS (default in Node.js):**
-CommonJS (CJS) is the original module system Node.js used from the start. It uses require() to import and module.exports to export. It loads modules synchronously (one at a time, blocking until loaded).

```js
// mathUtils.js
function add(a, b) {
  return a + b;
}
module.exports = { add };

// app.js
const { add } = require('./mathUtils');
console.log(add(2, 3)); // 5
```

**ES Modules (supported in modern Node.js):**
-ES Modules (ESM) is the newer, standardized JavaScript module system (also used in browsers). It uses import and export keywords. It's designed to support asynchronous loading 

```js
// mathUtils.mjs
export function add(a, b) {
  return a + b;
}

// app.mjs
import { add } from './mathUtils.mjs';
console.log(add(2, 3)); // 5
```