Local copy of Transformers.js 2.17.2 and ONNX Runtime WASM.
Chrome extensions cannot load scripts from a CDN (`script-src` must be `'self'`).
The MiniLM weights live in `../models/Xenova/all-MiniLM-L6-v2/` so the extension never fetches them from Hugging Face.
