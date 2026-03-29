FROM oven/bun:alpine

WORKDIR /app
COPY GeoIP2-City-Test.mmdb index.ts ./

EXPOSE 3030
CMD ["bun", "index.ts"]
