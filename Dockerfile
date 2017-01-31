FROM ubuntu:16.04

# RUN apt-get update \
#     && apt-get install -y \
#         libgtk2.0-0 \
#         libxtst6 \
#         libxss1 \
#         libgconf-2-4 \
#         libnss3 \
#         libasound2 \
#         xvfb \
#         curl

RUN apt-get update \
    && apt-get install -y \
        xvfb \
        x11-xkb-utils \
        x11-xserver-utils \
        xfonts-100dpi \
        xfonts-75dpi \
        xfonts-scalable \
        xfonts-cyrillic \
        x11-apps \
        clang \
        libdbus-1-dev \
        libgtk2.0-dev \
        libnotify-dev \
        libgnome-keyring-dev \
        libgconf2-dev \
        libasound2-dev \
        libcap-dev \
        libcups2-dev \
        libxtst-dev \
        libxss1 \
        libnss3-dev \
        gcc-multilib \
        g++-multilib \
        curl

# Install nodejs 4.3.2.
RUN curl -kL https://nodejs.org/dist/v6.9.4/node-v6.9.4-linux-x64.tar.gz \
	| tar -C /usr/local --strip-components 1 -xz

WORKDIR /app

COPY package.json /app/package.json
RUN npm install

# ENTRYPOINT xvfb-run --server-args="+extension RANDR -screen 0 1920x1080x8" node index.js
ENTRYPOINT xvfb-run --server-args="-ac +extension GLX +extension RANDR +render -screen 0 1920x1080x8" node index.js
# ENTRYPOINT xvfb-run node index.js
# ENTRYPOINT node index.js

RUN apt-get install -y gtk+2.0