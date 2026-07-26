# Builds the backend image: installs dependencies, copies code, compiles TypeScript, and defines the startup command.

FROM node:24-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "start"]

