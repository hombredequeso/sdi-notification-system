import express, { Express, Request, Response } from 'express';
import { getAllSendMessageNotifications } from './notifications';
import { emailNotificationRegistration, NotificationTemplate, SendTextNotificationCommand, UserNotificationPreferences } from './types';

import * as t from 'io-ts'

import * as E from "fp-ts/Either";
import { Either } from "fp-ts/lib/Either";

import { v4 as uuidv4 } from "uuid";
import { STATUS_CODES } from 'http';

const app: Express = express();
const port = process.env.PORT || 8080;

app.use(express.json());


app.get('/', (req: Request, res: Response) => {
  res.send('ok');
});

const TestNotificatonBody = t.type({
  message: t.string,
  userId: t.string
})


app.post('/testnotification', (req: Request, res: Response) => {
  // for now, assume the best :-)
  // And also, pretty much hardcode everything.
  // And at the end, just log it out to the console rather than do anything useful with it :-)
  const body = req.body;
  const decodedBody = TestNotificatonBody.decode(body);
  if (E.isLeft(decodedBody)) {
    res.status(400).send('Bad request')
    return;
  }

  const command: SendTextNotificationCommand = decodedBody.right;
  const userNotificationPreferences: UserNotificationPreferences = {
    userId: uuidv4(),
    notificationRegistrations: [
      emailNotificationRegistration('abc@def.com')
    ]
  };
  const template: NotificationTemplate = 
    {
      commandType: "SendTextNotificationCommand",
      registrationType: "EmailNotificationRegistration",
      template: "{{message}}"
    };

  const result =  getAllSendMessageNotifications(
    userNotificationPreferences,
    command,
    [template]
  );
  console.log(JSON.stringify(result));

  res.send(command);
} )

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
