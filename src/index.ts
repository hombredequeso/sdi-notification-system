import express, { Express, Request, Response } from 'express';
import { getAllSendMessageNotifications } from './notifications';
import { emailNotificationRegistration, NotificationTemplate, SendTextNotificationCommand, SendTextNotificationCommandT, UserNotificationPreferences, UUID } from './types';

import * as t from 'io-ts'

import * as E from "fp-ts/Either";
import { Either } from "fp-ts/lib/Either";

import * as O from "fp-ts/Option";
import { Option } from "fp-ts/Option";

import * as A from "fp-ts/Array";

import { v4 as uuidv4 } from "uuid";
import { STATUS_CODES } from 'http';

const app: Express = express();
const port = process.env.PORT || 8080;

app.use(express.json());


app.get('/', (req: Request, res: Response) => {
  res.send('ok');
});

const TextNotificatonBodyT = t.type({
  message: t.string,
  userId: t.string
})
type TextNotificationBody = t.TypeOf<typeof TextNotificatonBodyT>;

enum Status {
  Accepted = 202
}

import amqplib, { Channel, Connection, Options } from 'amqplib'
import { getUserNotificationPreferences } from './user-notification-preferences';
import { getTemplate } from './templates';
import { Validation } from 'io-ts';
// rabbitmq to be global variables
let channel: Channel, connection: Connection
let options: Options.AssertQueue = {durable: false}


connect()

// connect to rabbitmq
async function connect() {
  try {
      // rabbitmq default port is 5672
    const amqpServer = 'amqp://localhost:5672'
    connection = await amqplib.connect(amqpServer)
    channel = await connection.createChannel()

    // make sure that the order channel is created, if not this statement will create it
    await channel.assertQueue('hello', options);
  } catch (error) {
    console.log(error)
  }
}

// app.post('/notification', (req: Request, res: Response) => {

// app.post('/ordercancellednotification', (req: Request, res: Response) => {
// app.post('/orderdispatchednotification', (req: Request, res: Response) => {
app.post('/textnotification', (req: Request, res: Response) => {
  // for now, assume the best :-)
  // And also, pretty much hardcode everything.
  // And at the end, just log it out to the console rather than do anything useful with it :-)
  
  // Get the command:
  const decodedBody: Validation<TextNotificationBody> = TextNotificatonBodyT.decode(req.body);

  if (E.isLeft(decodedBody)) {
    res.status(400).send('Bad request')
    return;
  }

  const command: SendTextNotificationCommand = decodedBody.right;
  const commandId = uuidv4();

  // Get the users notification preferences
  const userNotificationPreferences: UserNotificationPreferences = 
    getUserNotificationPreferences(command.userId);

  // Get relevant templates
  const template: Option<NotificationTemplate> = getTemplate('SendTextNotificationCommand');
  const templates = A.fromOption(template);

  // Get any notifications...
  const result =  getAllSendMessageNotifications(
    userNotificationPreferences,
    command,
    templates
  );

  // Just log them for now.
  console.log(JSON.stringify(result));

  // Preliminary messaging work: also, send a message to a queue.
  sendToQueue(commandId, command);

  const responseBody = {
    task: {
      href: `/textnotification/${commandId}`,
      id: commandId
    }
  }

  res.status(Status.Accepted).send(responseBody);
} )

const sendToQueue = (commandId: UUID, command: SendTextNotificationCommand) => {

  // Preliminary messaging work: also, send a message to a queue.
  const messageHeader = {
    messageId: commandId,
    timestamp: new Date(),
    messageType: 'SendTextNotificationCommand'
  };

  const message = {
    header: messageHeader,
    body: command
  };


  // send a message to all the services connected to 'order' queue, add the date to differentiate between them
  channel.sendToQueue(
    
    'hello',
    Buffer.from(
      JSON.stringify(message)
    ),
  )
}

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
