FROM oven/bun:alpine

WORKDIR /app
COPY index.ts ./
COPY pages/ ./pages/

EXPOSE 4001
CMD ["bun", "index.ts"]
