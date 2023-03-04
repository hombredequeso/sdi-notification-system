Messing around with building a notification system.
Working towards messaging based, but currently a simple api.

Loosely based around:
Alex Xu, _System Design Interview_, chapter 10 (Design a notification system)


# Messaging with RabbitMQ

To use, start a rabbitmq message broker:
```
docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.11-management

```

Start something to listen:
```
node ./scripts/receive.js
```

Then start api server as usual:
```
yarn start
```

Then send it a command:

```
curl --location 'http://localhost:8080/testnotification' \
--header 'Content-Type: application/json' \
--data '{
    "message": "hello world",
    "userId": "mrc"
}'
```


## References
[RabbitMQ Tutorial - Hello World](https://www.rabbitmq.com/tutorials/tutorial-one-javascript.html)
[Microservices with express.js and rabbitmq](https://dev.to/omardiaa48/microservices-with-expressjs-and-rabbitmq-34dk)
