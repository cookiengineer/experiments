#!/bin/bash

PROJECT_ROOT=$(cd "$(dirname "$(readlink -f "$0")")/../"; pwd);
INO_DEVICE=`ls /dev/ttyUSB* | grep ttyUSB | head -1`;
INO_TOOL=`which ino`;


if [[ "$INO_TOOL" != "" && "$INO_DEVICE" != "" ]]; then

	cd $PROJECT_ROOT/arduino;
	$INO_TOOL build -m uno;
	$INO_TOOL upload -m uno -p $INO_DEVICE;

fi;

