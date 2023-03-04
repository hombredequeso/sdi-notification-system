import express, { Express, Request, Response } from 'express';
import { getAllSendMessageNotifications } from './notifications';
import { emailNotificationRegistration, NotificationTemplate, SendTextNotificationCommand, UserNotificationPreferences } from './types';

import { v4 as uuidv4 } from "uuid";

const app: Express = express();
const port = process.env.PORT || 8080;

app.use(express.json());


app.get('/', (req: Request, res: Response) => {
  res.send('ok');
});

app.post('/testnotification', (req: Request, res: Response) => {
  // for now, assume the best :-)
  // And also, pretty much hardcode everything.
  // And at the end, just log it out to the console rather than do anything useful with it :-)
  const body = req.body;
  const command: SendTextNotificationCommand = body;
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
