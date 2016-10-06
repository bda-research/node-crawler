# Use the official Docker images
# https://registry.hub.docker.com/_/node/
#
FROM node:0.12.7

RUN apt-get update

RUN apt-get install -y python python-pip

RUN pip install httpbin gunicorn