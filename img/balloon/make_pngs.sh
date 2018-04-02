#!/bin/bash
echo "hello, $USER. I wish to list some files of yours"
echo "listing files in the current directory, $PWD"
ls  # list files
for i in *.gif
	do 
		echo ${i};
		convert ${i}[0] ${i%.gif}.png
	done