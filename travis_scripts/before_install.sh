#!/bin/sh
sudo pip install httpbin
sudo pip install gunicorn
gunicorn httpbin:app -b 127.0.0.1:8000 -w 6 --daemon