import { v4 as uuidv4 } from "uuid";

type UUID = string;
type EmailAddress = string;
type SmsPhoneNumber = string;
type AndroidDeviceId = string;
type IosDeviceId = string;

type SendTextNotificationCommand = {
  message: string;
  userId: UUID;
};

type EmailNotification = { emailAddress: EmailAddress; body: string };
type SmsNotification = { smsPhoneNumber: SmsPhoneNumber; text: string };
type AndroidNotification = { deviceId: AndroidDeviceId; message: string };
type IosNotification = { deviceId: IosDeviceId; message: string };

type Notification =
  | EmailNotification
  | SmsNotification
  | IosNotification
  | AndroidNotification;

type UserNotificationPreferences = {
  userId: UUID;
  notificationRegistrations: NotificationRegistration[];
};

import * as O from "fp-ts/Option";
import { Option } from "fp-ts/Option";

import * as E from "fp-ts/Either";
import { Either } from "fp-ts/Either";

import * as A from "fp-ts/Array";

import { pipe } from "fp-ts/function";

import { findFirst } from "fp-ts/Array";

type NotificationTemplate = {
  commandType: string;
  registrationType: string;
  template: string;
};

import * as Mustache from "mustache";
import exp from "constants";
const generateEmail = (
  preferredName: string,
  cmd: SendTextNotificationCommand,
  template: string
) => Mustache.render(template, { preferredName, message: cmd.message });

describe("generateEmail", () => {
  test("returns right thing", () => {
    const template = "Dear {{preferredName}}, {{message}}";

    expect(
      generateEmail(
        "Mark",
        { message: "this is a message", userId: uuidv4() },
        template
      )
    ).toEqual("Dear Mark, this is a message");
  });
});

type EmailNotificationRegistration = {
  _type: string;
  emailAddress: EmailAddress;
};
const emailNotificationRegistration = (emailAddress: EmailAddress) => ({
  _type: "EmailNotificationRegistration",
  emailAddress: emailAddress,
});

type SmsNotificationRegistration = {
  _type: string;
  smsPhoneNumber: SmsPhoneNumber;
};
const smsNotificationRegistration = (sms: SmsPhoneNumber) => ({
  _type: "SmsNotificationRegistration",
  sms: sms,
});

type AndroidNotificationRegistration = {
  _type: string;
  android: AndroidDeviceId;
};
const androidNotificationRegistration = (android: AndroidDeviceId) => ({
  _type: "AndroidNotificationRegistration",
  android: android,
});

type IosNotificationRegistration = {
  _type: string;
  ios: IosDeviceId;
};
const iosNotificationRegistration = (ios: IosDeviceId) => ({
  _type: "IosNotificationRegistration",
  ios: ios,
});

type NotificationRegistration =
  | EmailNotificationRegistration
  | SmsNotificationRegistration;
// | AndroidNotificationRegistration
// | IosNotificationRegistration;

const isEmailNotificationRegistration = (
  n: NotificationRegistration
): n is EmailNotificationRegistration =>
  n._type === "EmailNotificationRegistration";

const isSmsNotificationRegistration = (
  n: NotificationRegistration
): n is SmsNotificationRegistration =>
  n._type === "SmsNotificationRegistration";

const getTemplate = (
  templates: NotificationTemplate[],
  commandType: string,
  registrationType: string
) =>
  pipe(
    templates,
    A.findFirst(
      (t) =>
        t.commandType === commandType && t.registrationType === registrationType
    )
  );

type TemplateDoesNotExist = {
  commandType: string;
  registrationType: string;
};

type PipelineError = TemplateDoesNotExist;

const getEmailNotifications = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendTextNotificationCommand,
  template: string
): Notification[] => {
  const emailNotifications =
    userNotificationPreferences.notificationRegistrations
      .filter(isEmailNotificationRegistration)
      .map((emailNotification) => {
        return {
          emailAddress: emailNotification.emailAddress,
          body: Mustache.render(template, { message: cmd.message }),
        } as EmailNotification;
      });
  return emailNotifications;
};

const getSmsNotifications = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendTextNotificationCommand,
  template: string
): Notification[] => {
  const smsNotifications = userNotificationPreferences.notificationRegistrations
    .filter(isSmsNotificationRegistration)
    .map((smsNotification) => {
      return {
        smsPhoneNumber: smsNotification.smsPhoneNumber,

        text: Mustache.render(template, { message: cmd.message }),
      } as SmsNotification;
    });
  return smsNotifications;
};

type AllResults = { errors: PipelineError[]; notifications: Notification[] };

const errorArrayMonoid = A.getMonoid<PipelineError>();
const notificationArrayMonoid = A.getMonoid<Notification>();

const addToResult = (
  result: AllResults,
  next: Either<PipelineError, Notification[]>
): AllResults => {
  return E.match(
    (pipelineError: PipelineError) => ({
      errors: errorArrayMonoid.concat([pipelineError], result.errors),
      notifications: result.notifications,
    }),
    (notifications: Notification[]) => ({
      errors: result.errors,
      notifications: notificationArrayMonoid.concat(
        notifications,
        result.notifications
      ),
    })
  )(next);
};

const getNotifications = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendTextNotificationCommand,
  templates: NotificationTemplate[]
): AllResults => {
  const results1: Either<PipelineError, Notification[]>[] = [
    getEmailNotificationsPipeline(userNotificationPreferences, cmd, templates),
    getSmsNotificationsPipeline(userNotificationPreferences, cmd, templates),
  ];

  const start: AllResults = { errors: [], notifications: [] };
  const processedResults: AllResults = A.reduce(start, addToResult)(results1);

  return processedResults;
};

const getEmailNotificationsPipeline = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendTextNotificationCommand,
  templates: NotificationTemplate[]
): Either<PipelineError, Notification[]> => {
  const commandType = "SendTextNotificationCommand";
  const registrationType = "EmailNotificationRegistration";

  const template = getTemplate(templates, commandType, registrationType);

  const result = pipe(
    template,
    O.map((t) =>
      getEmailNotifications(userNotificationPreferences, cmd, t.template)
    ),
    E.fromOption(() => ({ commandType, registrationType }))
  );
  return result;
};

const getSmsNotificationsPipeline = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendTextNotificationCommand,
  templates: NotificationTemplate[]
): Either<PipelineError, Notification[]> => {
  const commandType = "SendTextNotificationCommand";
  const registrationType = "SmsNotificationRegistration";

  const template = getTemplate(templates, commandType, registrationType);

  const result = pipe(
    template,
    O.map((t) =>
      getSmsNotifications(userNotificationPreferences, cmd, t.template)
    ),
    E.fromOption(() => ({ commandType, registrationType }))
  );
  return result;
};

describe("getNotifications", () => {
  test("returns nothing when there are no notifications to send", () => {
    const userNotificationPreferences: UserNotificationPreferences = {
      userId: uuidv4(),
      notificationRegistrations: [],
    };
    const cmd: SendTextNotificationCommand = {
      userId: userNotificationPreferences.userId,
      message: "hello world",
    };

    const emailBodyTemplate: NotificationTemplate = {
      commandType: "SendTextNotificationCommand",
      registrationType: "EmailNotificationRegistration",
      template: "{{message}}",
    };
    const expectedResult: AllResults = {
      errors: [],
      notifications: [],
    };

    expect(
      getNotifications(userNotificationPreferences, cmd, [emailBodyTemplate])
    ).toEqual(expectedResult);
  });

  test("returns single email notification", () => {
    const registration = emailNotificationRegistration("mark@domain.com");
    const userNotificationPreferences: UserNotificationPreferences = {
      userId: uuidv4(),
      notificationRegistrations: [registration],
    };

    const cmd: SendTextNotificationCommand = {
      userId: userNotificationPreferences.userId,
      message: "hello world",
    };
    const expectedNotification: EmailNotification = {
      emailAddress: "mark@domain.com",
      body: "hello world",
    };

    const emailBodyTemplate: NotificationTemplate = {
      commandType: "SendTextNotificationCommand",
      registrationType: "EmailNotificationRegistration",
      template: "{{message}}",
    };

    expect(
      getNotifications(userNotificationPreferences, cmd, [emailBodyTemplate])
    ).toEqual([E.right([expectedNotification])]);
  });
});
