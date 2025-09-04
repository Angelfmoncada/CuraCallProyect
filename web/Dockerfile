FROM node:20-alpine
WORKDIR /app
COPY web/package.json ./package.json
RUN npm i
COPY web/ /app/
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]