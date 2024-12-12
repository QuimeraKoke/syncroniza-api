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

FROM node:20-bullseye

COPY --from=build /usr/src/app/dist /usr/src/app/dist

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

EXPOSE 3000



