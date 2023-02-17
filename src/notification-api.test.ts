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

type CommandType = "SendTextNotificationCommand";

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
  commandType: CommandType;
  registrationType: NotificationRegistrationType;
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

type NotificationRegistrationType =
  | "EmailNotificationRegistration"
  | "SmsNotificationRegistration";

const isEmailNotificationRegistration = (
  n: NotificationRegistration
): n is EmailNotificationRegistration =>
  n._type === "EmailNotificationRegistration";

const isSmsNotificationRegistration = (
  n: NotificationRegistration
): n is SmsNotificationRegistration =>
  n._type === "SmsNotificationRegistration";

const getTemplates = (
  templates: NotificationTemplate[],
  commandType: CommandType,
  registrationType: NotificationRegistrationType
): NotificationTemplate[] =>
  pipe(
    templates,
    A.filter(
      (t) =>
        t.commandType === commandType && t.registrationType === registrationType
    )
  );

type TemplateDoesNotExist = {
  commandType: CommandType;
  registrationType: NotificationRegistrationType;
};

const getNotifications = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendTextNotificationCommand,
  templates: NotificationTemplate[]
): Either<TemplateDoesNotExist, EmailNotification>[] => {
  const notificationTemplateE: Either<
    TemplateDoesNotExist,
    NotificationTemplate
  > = pipe(
    getTemplates(
      templates,
      "SendTextNotificationCommand",
      "EmailNotificationRegistration"
    ),
    A.findFirst((_) => true),
    O.fold(
      () =>
        E.left({
          commandType: "SendTextNotificationCommand",
          registrationType: "EmailNotificationRegistration",
        }),
      (t) => E.right(t)
    )
  );

  const emailNotificationRegistrationA =
    userNotificationPreferences.notificationRegistrations.filter(
      isEmailNotificationRegistration
    );

  const notifications = pipe(
    emailNotificationRegistrationA,
    A.map((emailNotificationRegistration) => {
      return pipe(
        notificationTemplateE,
        E.map((notificationTemplate) =>
          getEmailNotifications(
            emailNotificationRegistration,
            cmd,
            notificationTemplate.template
          )
        )
      );
    })
  );
  return notifications;
};

const getEmailNotifications = (
  registration: EmailNotificationRegistration,
  cmd: SendTextNotificationCommand,
  template: string
): EmailNotification => ({
  emailAddress: registration.emailAddress,
  body: Mustache.render(template, { message: cmd.message }),
});

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
    const expectedResult: Either<TemplateDoesNotExist, EmailNotification>[] =
      [];

    expect(
      getNotifications(userNotificationPreferences, cmd, [emailBodyTemplate])
    ).toEqual(expectedResult);
  });

  test("returns a notification when there is one notifications to send", () => {
    const userNotificationPreferences: UserNotificationPreferences = {
      userId: uuidv4(),
      notificationRegistrations: [
        emailNotificationRegistration("someone@somewhere.com"),
      ],
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

    const expectedNotification: EmailNotification = {
      emailAddress: "someone@somewhere.com",
      body: "hello world",
    };

    const expectedResult: Either<TemplateDoesNotExist, EmailNotification>[] = [
      E.right(expectedNotification),
    ];

    expect(
      getNotifications(userNotificationPreferences, cmd, [emailBodyTemplate])
    ).toEqual(expectedResult);
  });

  test("returns an error when there is no template matching the notification type", () => {
    const userNotificationPreferences: UserNotificationPreferences = {
      userId: uuidv4(),
      notificationRegistrations: [
        emailNotificationRegistration("someone@somewhere.com"),
      ],
    };
    const cmd: SendTextNotificationCommand = {
      userId: userNotificationPreferences.userId,
      message: "hello world",
    };

    const noTemplates: NotificationTemplate[] = [];

    const expectedError: TemplateDoesNotExist = {
      commandType: "SendTextNotificationCommand",
      registrationType: "EmailNotificationRegistration",
    };

    const expectedResult: Either<TemplateDoesNotExist, EmailNotification>[] = [
      E.left(expectedError),
    ];

    expect(
      getNotifications(userNotificationPreferences, cmd, noTemplates)
    ).toEqual(expectedResult);
  });
});
