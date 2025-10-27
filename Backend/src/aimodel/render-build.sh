#!/usr/bin/env bash

# Download and extract static FFmpeg binary
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz | tar -xJ
mv ffmpeg-*-static/ffmpeg ./ffmpeg
chmod +x ./ffmpeg

# Add current directory to PATH so ./ffmpeg is found
export PATH=$PATH:$(pwd)

# Install Python dependencies
pip install -r requirements.txt