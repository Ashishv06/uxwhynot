# Uses Microsoft's official Playwright image, which already bundles Chromium
# and every system library it needs (fonts, gtk, etc.) — pinned to the exact
# same Playwright version as package.json so the browser baked into the
# image matches the version this app actually asks for. Lighthouse
# (lib/runLighthouse.js) reuses this same Chromium via chrome-launcher, so
# one image covers both.
FROM mcr.microsoft.com/playwright:v1.62.1-jammy

WORKDIR /app

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
