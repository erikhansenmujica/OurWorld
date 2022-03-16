FROM node:erbium-alpine as builder
WORKDIR /app
COPY package*.json /app/
COPY . /app
RUN npm run build
RUN npm prune --production && npm cache verify

#

FROM node:erbium-alpine
WORKDIR /app
COPY --from=builder /app .

RUN npx next telemetry disable

EXPOSE 3000

CMD ["./node_modules/.bin/vite", "start"]
