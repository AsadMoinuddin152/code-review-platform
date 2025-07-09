// client/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import crypto from 'crypto';

// Polyfill Node’s new crypto.hash() for Vite on Node < v20,
// returning a hex string so `.substring()` works.
if (typeof crypto.hash !== 'function') {
  crypto.hash = (algorithm, data) =>
    crypto
      .createHash(algorithm)
      .update(data)
      .digest('hex');
}

export default defineConfig({
  plugins: [react()],
});
