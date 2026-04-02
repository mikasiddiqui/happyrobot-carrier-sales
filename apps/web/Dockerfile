FROM node:20-alpine AS build

WORKDIR /app/apps/web

RUN corepack enable

COPY apps/web/package.json apps/web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY apps/web ./

ARG VITE_API_BASE_URL=
ARG VITE_API_PUBLIC_KEY=
ARG VITE_HAPPYROBOT_DEPLOYMENT_URL=

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_PUBLIC_KEY=${VITE_API_PUBLIC_KEY}
ENV VITE_HAPPYROBOT_DEPLOYMENT_URL=${VITE_HAPPYROBOT_DEPLOYMENT_URL}

RUN pnpm build

FROM nginx:1.27-alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
