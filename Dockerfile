# Uses Microsoft's official Playwright image, which already bundles Chromium
# and every system library it needs (fonts, gtk, etc.) — pinned to the exact
# same Playwright version as package.json so the browser baked into the
# image matches the version this app actually asks for. Lighthouse
# (lib/runLighthouse.js) reuses this same Chromium via chrome-launcher, so
# one image covers both.
FROM mcr.microsoft.com/playwright:v1.62.1-jammy

WORKDIR /app

# better-sqlite3 ships prebuilt binaries for most platforms, but when none
# matches (e.g. a very new Node version, like this image's), npm falls back
# to compiling it from source via node-gyp — which needs a C++ toolchain
# this base image doesn't include by default.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies first so this layer is cached across builds that
# don't touch package.json/package-lock.json.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# next build needs NODE_ENV=production behavior; next itself defaults to
# this during `next build`, set explicitly for clarity and for `next start`.
ENV NODE_ENV=production
RUN npm run build

# Render/Railway inject their own PORT at runtime — `next start` (via
# `npm start`) already respects process.env.PORT, so no hardcoding here.
EXPOSE 3000

CMD ["npm", "start"]
