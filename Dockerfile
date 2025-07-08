# syntax=docker/dockerfile:1.4
FROM node:18-alpine
WORKDIR /app

# copy manifest
COPY package.json package-lock.json ./

# mount cache tanpa menyebut id sama sekali
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

COPY . .
RUN npm run build

CMD ["npm", "start"]
