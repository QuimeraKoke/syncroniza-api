FROM ubuntu:latest
LABEL authors="Jorge Gutiérrez"

FROM node:20-bullseye AS build

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:1.21.3

COPY --from=build /usr/src/app/dist /usr/share/nginx/html

EXPOSE 80



