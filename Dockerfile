# base image
FROM node:18.16.0

# set working directory
WORKDIR /home/node/app

# install and cache app dependencies
COPY package*.json .

RUN npm install

EXPOSE 4000

# start app
CMD ["npm", "run", "dev"]