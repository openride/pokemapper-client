FROM node:6-slim
RUN mkdir /app
ADD . /app
WORKDIR /app
RUN npm install --production
RUN npm run build
EXPOSE 4000
CMD node server/index.built.js
