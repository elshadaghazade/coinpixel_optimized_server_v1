FROM ubuntu:latest
RUN apt -o Acquire::Check-Valid-Until=false -o Acquire::Check-Date=false update
RUN apt install -y nodejs npm curl
RUN npm i -g n
RUN n latest
RUN npm i -g npm@latest
WORKDIR /apps
COPY . .
RUN npm i --production
EXPOSE 5501
EXPOSE 8080
CMD [ "npm", "start" ]
