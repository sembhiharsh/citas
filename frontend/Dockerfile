FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Vite dev command requires --host 0.0.0.0 to expose the port outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
