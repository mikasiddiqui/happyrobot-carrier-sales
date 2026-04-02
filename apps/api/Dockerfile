FROM node:20-alpine AS build

WORKDIR /app/apps/api

COPY apps/api/package*.json ./
RUN npm ci

COPY apps/api/tsconfig.json ./tsconfig.json
COPY apps/api/src ./src

RUN npm run build

FROM node:20-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app/apps/api

COPY apps/api/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/apps/api/dist ./dist

WORKDIR /app
COPY data ./data
RUN mkdir -p /app/data/runtime && chown -R node:node /app

USER node

EXPOSE 3001

WORKDIR /app/apps/api
CMD ["npm", "run", "start"]
