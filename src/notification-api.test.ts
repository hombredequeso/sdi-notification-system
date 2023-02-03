import { v4 as uuidv4 } from 'uuid';

type EmailNotification = {msg: string};
type SmsNotification = {msg: string}
type AndroidNotification = {msg: string}
type IosNotification = {msg: string}


type UUID = string;
type EmailAddress = string;
type SMS = string;
type AndroidDeviceId = string;
type IosDeviceId = string;



import * as O from 'fp-ts/Option'
import {Option} from 'fp-ts/Option'

import * as A from 'fp-ts/Array'

import { pipe } from 'fp-ts/function'

import Mustache from 'mustache'

type SendTextNotificationCommand = {
  msg: string, 
  userId: UUID
}

const generateEmail = (preferredName: string, cmd: SendTextNotificationCommand, template: string) => 
  Mustache.render(template, {preferredName, message: cmd.msg});


describe('generateEmail', () => {
  test('returns right thing', () => {
    const template = 'Dear {{preferredName}}, {{message}}'

    expect(generateEmail('Mark', {msg: 'this is a message', userId: uuidv4()}, template)).toEqual('Dear Mark, this is a message');
  });
});

type UserNotificationPreferences = {
  userId: UUID,
  emailAddress: Option<EmailAddress>
  sms: Option<SMS>
  android: Option<AndroidDeviceId>
  ios: Option<IosDeviceId>
}

type Notification = EmailNotification | SmsNotification | IosNotification | AndroidNotification;

const getEmailNotification =
  (cmd: SendTextNotificationCommand,
    userNotificationPreferences: Option<UserNotificationPreferences>): Option<EmailNotification> => {
      const result: Option<EmailNotification> = pipe(
        userNotificationPreferences,
        O.chain(u => u.emailAddress),
        O.map(_ => ({msg: cmd.msg}))
      );
      return result;
  }


const getSmsNotification =
  (cmd: SendTextNotificationCommand,
    userNotificationPreferences: Option<UserNotificationPreferences>): Option<SmsNotification> => {
      const result: Option<EmailNotification> = pipe(
        userNotificationPreferences,
        O.chain(u => u.sms),
        O.map(_ => ({msg: cmd.msg}))
      );
      return result;
  }

const getAndroidNotification =
  (cmd: SendTextNotificationCommand,
    userNotificationPreferences: Option<UserNotificationPreferences>): Option<AndroidNotification> => {
      const result: Option<AndroidNotification> = pipe(
        userNotificationPreferences,
        O.chain(u => u.android),
        O.map(_ => ({msg: cmd.msg}))
      );
      return result;
  }

const getIosNotification =
  (cmd: SendTextNotificationCommand,
    userNotificationPreferences: Option<UserNotificationPreferences>): Option<IosNotification> => {
      const result: Option<IosNotification> = pipe(
        userNotificationPreferences,
        O.chain(u => u.android),
        O.map(_ => ({msg: cmd.msg}))
      );
      return result;
  }

const getNotifications = (
  cmd: SendTextNotificationCommand, 
  userNotificationPreferences: Option<UserNotificationPreferences>)
  : Notification[] =>
  A.compact<Notification>([
    getEmailNotification(cmd, userNotificationPreferences),
    getSmsNotification(cmd, userNotificationPreferences),
    getAndroidNotification(cmd, userNotificationPreferences),
    getIosNotification(cmd, userNotificationPreferences),
  ]);

describe('getNotification', () => {
  test('returns all required notifications ', () => {

    const sendTextNotificationCommand: SendTextNotificationCommand = {
      msg: 'hello world',
      userId: uuidv4()
    };
    const userPreferences: UserNotificationPreferences = {
      userId: sendTextNotificationCommand.userId,
      emailAddress: O.some('test@domain.com'),
      sms: O.some('123456'),
      android: O.none,
      ios: O.none,
    };

    const emailNotification: EmailNotification = {
      msg: 'hello world'
    };

    const smsNotification: SmsNotification = {msg: 'hello world'};

    expect(getNotifications(sendTextNotificationCommand, O.some(userPreferences)))
      .toEqual([emailNotification, smsNotification]);
  });
});

describe('notification api', () => {
  test('returns no notification if ', () => {
    const sendTextNotificationCommand: SendTextNotificationCommand = {
      msg: 'hello world',
      userId: uuidv4()
    };

    const emailNotification: EmailNotification = {
      msg: 'hello world'
    };

    expect(getEmailNotification(sendTextNotificationCommand, O.none)).toEqual(O.none);
  });


  test('getEmailNotification returns notification when user is subscribed for emails', () => {
    const sendTextNotificationCommand: SendTextNotificationCommand = {
      msg: 'hello world',
      userId: uuidv4()
    };
    const userPreferences: UserNotificationPreferences = {
      userId: sendTextNotificationCommand.userId,
      emailAddress: O.some('test@domain.com'),
      sms: O.none,
      android: O.none,
      ios: O.none,
    };

    const emailNotification: EmailNotification = {
      msg: 'hello world'
    };

    expect(getEmailNotification(sendTextNotificationCommand, O.some(userPreferences))).toEqual(O.some(emailNotification));
  });


  test('getEmailNotification returns none when user is not subscribed for emails', () => {
    const sendTextNotificationCommand: SendTextNotificationCommand = {
      msg: 'hello world',
      userId: uuidv4()
    };
    const userPreferences: UserNotificationPreferences = {
      userId: sendTextNotificationCommand.userId,
      emailAddress: O.none,
      sms: O.none,
      android: O.none,
      ios: O.none,
    };

    const emailNotification: EmailNotification = {
      msg: 'hello world'
    };

    expect(getEmailNotification(sendTextNotificationCommand, O.some(userPreferences))).toEqual(O.none);
  });


  test('getSmsNotification returns notification when user is subscribed for sms', () => {
    const sendTextNotificationCommand: SendTextNotificationCommand = {
      msg: 'hello world',
      userId: uuidv4()
    };
    const userPreferences: UserNotificationPreferences = {
      userId: sendTextNotificationCommand.userId,
      emailAddress: O.none,
      sms: O.some('123456'),
      android: O.none,
      ios: O.none,
    };

    const smsNotification: SmsNotification = {
      msg: 'hello world'
    };

    expect(getSmsNotification(sendTextNotificationCommand, O.some(userPreferences))).toEqual(O.some(smsNotification));
  });
});