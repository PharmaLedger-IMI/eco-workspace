#!/bin/bash

docker build -t paiuscatalin/eco "$(dirname $(readlink -f $0))" --no-cache --network host
