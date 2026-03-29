FROM oven/bun:alpine

WORKDIR /app
COPY index.ts ./
COPY pages/ ./pages/

EXPOSE 4002
CMD ["bun", "index.ts"]
