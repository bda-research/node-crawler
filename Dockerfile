# Use the official Docker images
# https://registry.hub.docker.com/_/node/
#
FROM node:9.3.0-stretch

RUN apt-get update

RUN apt-get install -y python3-pip python3-dev

RUN pip3 install --upgrade cffi
RUN pip3 install httpbin gunicorn


RUN npm install crawler -g
