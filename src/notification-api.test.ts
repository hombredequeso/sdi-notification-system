import { v4 as uuidv4 } from "uuid";



import * as E from "fp-ts/Either";
import { Either } from "fp-ts/Either";


import * as Mustache from "mustache";
import { EmailNotification, EmailNotificationRegistration, emailNotificationRegistration, isEmailNotificationRegistration, isSmsNotificationRegistration, NotificationRegistrationType, NotificationTemplate, SendOrderDispatchedCommand, SendTextNotificationCommand, SmsNotification, SmsNotificationRegistration, smsNotificationRegistration, TemplateDoesNotExist, UserNotificationPreferences } from "./types";
import { getAllSendMessageNotifications, getAllSendOrderDispatchedNotifications } from "./notifications";





// Testing mustache template rendering.

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






// Tests:

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
      getAllSendMessageNotifications(userNotificationPreferences, cmd, [
        emailBodyTemplate,
      ])
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
      getAllSendMessageNotifications(userNotificationPreferences, cmd, [
        emailBodyTemplate,
      ])
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
      getAllSendMessageNotifications(
        userNotificationPreferences,
        cmd,
        noTemplates
      )
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
    const result = getAllSendMessageNotifications(
      userNotificationPreferences,
      cmd,
      [smsBodyTemplate]
    );

    expect(result).toEqual([expectedResult]);
  });
});

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
    const result = getAllSendOrderDispatchedNotifications(
      userNotificationPreferences,
      cmd,
      [smsBodyTemplate]
    );

    expect(result).toEqual([expectedResult]);
  });
});
