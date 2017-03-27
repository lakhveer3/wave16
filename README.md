# MicroBob

To run open terminal 

$ docker-compose build
$ docker-compose up


To run in production 

$ docker-compose build
In First terminal
$ docker-compose up consul redis mongodb
In Second Terminal
$ docker-compose up base
In Other Terminals
$ docker-compose up {Microservice image name}
