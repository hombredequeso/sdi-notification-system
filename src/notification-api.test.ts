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

type CommandType = "SendTextNotificationCommand" | "SendOrderDispatchedCommand";

type EmailNotification = { emailAddress: EmailAddress; body: string };
type SmsNotification = { phoneNumber: SmsPhoneNumber; text: string };
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
  phoneNumber: SmsPhoneNumber;
};
const smsNotificationRegistration = (
  phoneNumber: SmsPhoneNumber
): SmsNotificationRegistration => ({
  _type: "SmsNotificationRegistration",
  phoneNumber: phoneNumber,
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

type TemplateDoesNotExist = {
  commandType: CommandType;
  registrationType: NotificationRegistrationType;
};

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

const getTemplate = (
  templates: NotificationTemplate[],
  commandType: CommandType,
  registrationType: NotificationRegistrationType
): Either<TemplateDoesNotExist, NotificationTemplate> => {
  const notificationTemplateE: Either<
    TemplateDoesNotExist,
    NotificationTemplate
  > = pipe(
    getTemplates(templates, commandType, registrationType),
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
  return notificationTemplateE;
};

const getEmailNotification = (
  registration: EmailNotificationRegistration,
  cmd: SendTextNotificationCommand,
  template: string
): EmailNotification => ({
  emailAddress: registration.emailAddress,
  body: Mustache.render(template, { message: cmd.message }),
});

const getSmsNotification = (
  registration: SmsNotificationRegistration,
  cmd: SendTextNotificationCommand,
  template: string
): SmsNotification => ({
  phoneNumber: registration.phoneNumber,
  text: Mustache.render(template, { message: cmd.message }),
});

const getSmsNotifications = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendTextNotificationCommand,
  templates: NotificationTemplate[]
) => {
  const smsNotifications: Either<TemplateDoesNotExist, Notification>[] = pipe(
    userNotificationPreferences.notificationRegistrations,
    A.filter(isSmsNotificationRegistration),
    A.map((smsNotificationRegistration) => {
      const notificationTemplateE = getTemplate(
        templates,
        "SendTextNotificationCommand",
        "SmsNotificationRegistration"
      );

      return pipe(
        notificationTemplateE,
        E.map((notificationTemplate) =>
          getSmsNotification(
            smsNotificationRegistration,
            cmd,
            notificationTemplate.template
          )
        )
      );
    })
  );
  return smsNotifications;
};

const getEmailNotifications = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendTextNotificationCommand,
  templates: NotificationTemplate[]
): Either<TemplateDoesNotExist, Notification>[] => {
  const emailNotifications =
    userNotificationPreferences.notificationRegistrations;
  return pipe(
    emailNotifications,
    A.filter(isEmailNotificationRegistration),
    A.map((emailNotificationRegistration) => {
      const notificationTemplateE = getTemplate(
        templates,
        "SendTextNotificationCommand",
        "EmailNotificationRegistration"
      );

      return pipe(
        notificationTemplateE,
        E.map((notificationTemplate) =>
          getEmailNotification(
            emailNotificationRegistration,
            cmd,
            notificationTemplate.template
          )
        )
      );
    })
  );
};

const getOrderDispatchedSmsNotification = (
  registration: SmsNotificationRegistration,
  cmd: SendOrderDispatchedCommand,
  template: string
): SmsNotification => {
  return {
    phoneNumber: registration.phoneNumber,
    text: Mustache.render(template, { order: cmd.order }),
  };
};

const getOrderDispatchedSmsNotifications = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendOrderDispatchedCommand,
  templates: NotificationTemplate[]
): Either<TemplateDoesNotExist, Notification>[] => {
  const smsNotifications: Either<TemplateDoesNotExist, Notification>[] = pipe(
    userNotificationPreferences.notificationRegistrations,
    A.filter(isSmsNotificationRegistration),
    A.map((smsNotificationRegistration) => {
      const notificationTemplateE = getTemplate(
        templates,
        "SendOrderDispatchedCommand",
        "SmsNotificationRegistration"
      );

      return pipe(
        notificationTemplateE,
        E.map((notificationTemplate) =>
          getOrderDispatchedSmsNotification(
            smsNotificationRegistration,
            cmd,
            notificationTemplate.template
          )
        )
      );
    })
  );
  return smsNotifications;
};

const getSendOrderDispatchedNotifications = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendOrderDispatchedCommand,
  templates: NotificationTemplate[]
): Either<TemplateDoesNotExist, Notification>[] => {
  return getOrderDispatchedSmsNotifications(
    userNotificationPreferences,
    cmd,
    templates
  );
};

const getNotifications = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendTextNotificationCommand,
  templates: NotificationTemplate[]
): Either<TemplateDoesNotExist, Notification>[] => {
  return pipe(
    [
      getEmailNotifications(userNotificationPreferences, cmd, templates),
      getSmsNotifications(userNotificationPreferences, cmd, templates),
    ],
    A.flatten
  );
};

describe("getNotifications with SetTextNotificationCommand and EmailNotification", () => {
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

describe("getNotifications with SetTextNotificationCommand and SmsNotification", () => {
  test("returns a notification when there is one notifications to send", () => {
    const userNotificationPreferences: UserNotificationPreferences = {
      userId: uuidv4(),
      notificationRegistrations: [smsNotificationRegistration("0404 123 456")],
    };
    const cmd: SendTextNotificationCommand = {
      userId: userNotificationPreferences.userId,
      message: "hello world",
    };

    const smsBodyTemplate: NotificationTemplate = {
      commandType: "SendTextNotificationCommand",
      registrationType: "SmsNotificationRegistration",
      template: "{{message}}",
    };

    const expectedNotification: SmsNotification = {
      phoneNumber: "0404 123 456",
      text: "hello world",
    };

    const expectedResult: Either<TemplateDoesNotExist, SmsNotification> =
      E.right(expectedNotification);
    const result = getNotifications(userNotificationPreferences, cmd, [
      smsBodyTemplate,
    ]);

    expect(result).toEqual([expectedResult]);
  });
});

type OrderDispatched = {
  orderId: string;
  orderSummary: string;
  dispatchDate: string;
  message: string;
};

type SendOrderDispatchedCommand = {
  order: OrderDispatched;
  userId: UUID;
};

describe("getNotifications with SendOrderDispatchedCommand and SmsNotification", () => {
  test("returns a notification when there is one notifications to send", () => {
    const userNotificationPreferences: UserNotificationPreferences = {
      userId: uuidv4(),
      notificationRegistrations: [smsNotificationRegistration("0404 123 456")],
    };
    const cmd: SendOrderDispatchedCommand = {
      userId: userNotificationPreferences.userId,
      order: {
        orderId: "TheOrderId",
        orderSummary: "OrderSummary",
        dispatchDate: "1/2/2023",
        message: "Thank-you for shopping with us",
      },
    };

    const smsBodyTemplate: NotificationTemplate = {
      commandType: "SendOrderDispatchedCommand",
      registrationType: "SmsNotificationRegistration",
      template:
        "{{order.orderId}}: {{order.orderSummary}} was shipped {{{order.dispatchDate}}}. {{order.message}}",
    };

    const expectedNotification: SmsNotification = {
      phoneNumber: "0404 123 456",
      text: "TheOrderId: OrderSummary was shipped 1/2/2023. Thank-you for shopping with us",
    };

    const expectedResult: Either<TemplateDoesNotExist, SmsNotification> =
      E.right(expectedNotification);
    const result = getSendOrderDispatchedNotifications(
      userNotificationPreferences,
      cmd,
      [smsBodyTemplate]
    );

    expect(result).toEqual([expectedResult]);
  });
});
