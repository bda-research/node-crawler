#!/bin/sh
pip install httpbin
pip install gunicorn
gunicorn httpbin:app -b 127.0.0.1:8000