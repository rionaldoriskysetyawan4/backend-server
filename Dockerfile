# syntax=docker/dockerfile:1.4
FROM node:18-alpine

# (1) Set working dir
WORKDIR /app

# (2) Copy hanya manifest & lockfile dulu
COPY package.json package-lock.json ./

# (3) Pasang dependencies dengan cache di ~/.npm
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci --omit=dev

# (4) Copy seluruh source code
COPY . .

# (5) Build (jika ada build step, misal TS compile atau bundling)
#    Kalau tidak perlu, boleh di‑comment atau di‑hapus baris ini
RUN npm run build

# (6) Expose port (sesuaikan dengan app-mu)
EXPOSE 3000

# (7) Jalankan app
CMD ["npm", "start"]
