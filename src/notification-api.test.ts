import { v4 as uuidv4 } from 'uuid';

type EmailNotification = {msg: string};
type UUID = string;
type EmailAddress = string;

import * as O from 'fp-ts/Option'
import {Option} from 'fp-ts/Option'

import { pipe } from 'fp-ts/function'


type SendTextNotificationCommand = {
  msg: string, 
  userId: UUID
}

type UserNotificationPreferences = {
  userId: UUID,
  emailAddress: Option<EmailAddress>
}

const getNotification =
  (cmd: SendTextNotificationCommand,
    userNotificationPreferences: Option<UserNotificationPreferences>): Option<EmailNotification> => {
      const result: Option<EmailNotification> = pipe(
        userNotificationPreferences,
        O.map(_ => ({msg: cmd.msg}))
      );
      return result;
  }

describe('notification api', () => {
  test('returns no notification if ', () => {
    const sendTextNotificationCommand: SendTextNotificationCommand = {
      msg: 'hello world',
      userId: uuidv4()
    };

    const emailNotification: EmailNotification = {
      msg: 'hello world'
    };

    expect(getNotification(sendTextNotificationCommand, O.none)).toEqual(O.none);
  });


  test('getNotification returns notification when user is subscribed for emails', () => {
    const sendTextNotificationCommand: SendTextNotificationCommand = {
      msg: 'hello world',
      userId: uuidv4()
    };
    const userPreferences: UserNotificationPreferences = {
      userId: sendTextNotificationCommand.userId,
      emailAddress: O.some('test@domain.com')
    };

    const emailNotification: EmailNotification = {
      msg: 'hello world'
    };

    expect(getNotification(sendTextNotificationCommand, O.some(userPreferences))).toEqual(O.some(emailNotification));
  });
});