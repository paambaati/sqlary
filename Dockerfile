# Stage 0 – Build (install dependencies, compile TypeScript, prune dev-dependencies)
FROM node:18-bullseye-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

WORKDIR /usr/src/sqlary
COPY . /usr/src/sqlary/
RUN npm ci && \
    npm run test && \
    rm -rf tests/ && \
    # Compile TS output, copy everything to where source was, then remove all TS sources.
    npm run build && \
    cp -R dist/* ./ && \
    find . -name "*.ts" -type f -delete && \
    npm prune --production

# Stage 1 – Run (copy node_modules and build output from stage 0 and run server)
FROM node:18-bullseye-slim AS runner

COPY --from=builder /usr/bin/dumb-init /usr/bin/dumb-init

USER node
WORKDIR /usr/src/sqlary
COPY --chown=node:node --from=builder /usr/src/sqlary /usr/src/sqlary

CMD ["dumb-init", "node", "index.js"]
