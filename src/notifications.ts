
import * as A from "fp-ts/Array";
// Top level

import * as O from "fp-ts/Option";
import { Option } from "fp-ts/Option";

import * as E from "fp-ts/Either";
import { Either } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import Mustache from "mustache";
import { CommandType, EmailNotification, EmailNotificationRegistration, isEmailNotificationRegistration, isSmsNotificationRegistration, NotificationRegistrationType, NotificationTemplate, SendOrderDispatchedCommand, SendTextNotificationCommand, SmsNotification, 
    SmsNotificationRegistration, 
    TemplateDoesNotExist, UserNotificationPreferences } from "./types";

// SendText : Email

const getEmailNotification = (
  registration: EmailNotificationRegistration,
  cmd: SendTextNotificationCommand,
  template: string
): EmailNotification => ({
  emailAddress: registration.emailAddress,
  body: Mustache.render(template, { message: cmd.message }),
});

// SendText: Sms

export const getSmsNotification = (
  registration: SmsNotificationRegistration,
  cmd: SendTextNotificationCommand,
  template: string
): SmsNotification => ({
  phoneNumber: registration.phoneNumber,
  text: Mustache.render(template, { message: cmd.message }),
});

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
// The main generic, pipeline.
// given:
//  * a way to getNotifications
//  * notificaiton templates
//  * a command to send some sort of notifications
// generate a list of notifications (or errors)

const getCmdNotificationsT =
  <TNotificationRegistration, TNotification, TCommand>(
    getNotifications: (
      r: TNotificationRegistration,
      c: TCommand,
      t: string
    ) => TNotification,
    commandType: CommandType,
    registrationType: NotificationRegistrationType
  ) =>
  (templates: NotificationTemplate[]) =>
  (cmd: TCommand) =>
  (
    notificationRegistrations: TNotificationRegistration[]
  ): Either<TemplateDoesNotExist, TNotification>[] => {
    const notificationTemplateE = getTemplate(
      templates,
      commandType,
      registrationType
    );

    return pipe(
      notificationRegistrations,
      A.map((notificationRegistration) =>
        pipe(
          notificationTemplateE,
          E.map((notificationTemplate) =>
            getNotifications(
              notificationRegistration,
              cmd,
              notificationTemplate.template
            )
          )
        )
      )
    );
  };

const getSendTextEmailNotifications = getCmdNotificationsT(
  getEmailNotification,
  "SendTextNotificationCommand",
  "EmailNotificationRegistration"
);

const getSendTextSmsNotifications = getCmdNotificationsT(
  getSmsNotification,
  "SendTextNotificationCommand",
  "SmsNotificationRegistration"
);

// OrderDispatched : Sms

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

const getOrderDispatchSmsNotificationsT = getCmdNotificationsT(
  getOrderDispatchedSmsNotification,
  "SendOrderDispatchedCommand",
  "SmsNotificationRegistration"
);


// OrderDispatched : Email

const getOrderDispatchedEmailNotification = (
  registration: EmailNotificationRegistration,
  cmd: SendOrderDispatchedCommand,
  template: string
): EmailNotification => {
  return {
    emailAddress: registration.emailAddress,
    body: Mustache.render(template, { order: cmd.order }),
  };
};

const getOrderDispatchEmailNotificationsT = getCmdNotificationsT(
  getOrderDispatchedEmailNotification,
  "SendOrderDispatchedCommand",
  "EmailNotificationRegistration"
);

const getOrderDispatchedEmailNotifications = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendOrderDispatchedCommand,
  templates: NotificationTemplate[]
): Either<TemplateDoesNotExist, EmailNotification>[] =>
  pipe(
    userNotificationPreferences.notificationRegistrations,
    A.filter(isEmailNotificationRegistration),
    getOrderDispatchEmailNotificationsT(templates)(cmd)
  );

export const getEmailNotifications = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendTextNotificationCommand,
  templates: NotificationTemplate[]
): Either<TemplateDoesNotExist, EmailNotification>[] =>
  pipe(
    userNotificationPreferences.notificationRegistrations,
    A.filter(isEmailNotificationRegistration),
    getSendTextEmailNotifications(templates)(cmd)
  );
export const getSmsNotifications = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendTextNotificationCommand,
  templates: NotificationTemplate[]
): Either<TemplateDoesNotExist, SmsNotification>[] =>
  pipe(
    userNotificationPreferences.notificationRegistrations,
    A.filter(isSmsNotificationRegistration),
    getSendTextSmsNotifications(templates)(cmd)
  );

export const getOrderDispatchedSmsNotifications = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendOrderDispatchedCommand,
  templates: NotificationTemplate[]
): Either<TemplateDoesNotExist, SmsNotification>[] =>
  pipe(
    userNotificationPreferences.notificationRegistrations,
    A.filter(isSmsNotificationRegistration),
    getOrderDispatchSmsNotificationsT(templates)(cmd)
  );

export const getAllSendOrderDispatchedNotifications = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendOrderDispatchedCommand,
  templates: NotificationTemplate[]
): Either<TemplateDoesNotExist, SmsNotification>[] => {
  return getOrderDispatchedSmsNotifications(
    userNotificationPreferences,
    cmd,
    templates
  );
};

export const getAllSendMessageNotifications = (
  userNotificationPreferences: UserNotificationPreferences,
  cmd: SendTextNotificationCommand,
  templates: NotificationTemplate[]
): Either<TemplateDoesNotExist, Notification>[] => {
  return pipe(
    [
      getEmailNotifications(userNotificationPreferences, cmd, templates).map((x) => E.map((n) => n as Notification)(x)),
      getSmsNotifications(userNotificationPreferences, cmd, templates).map((x) => E.map((n) => n as Notification)(x))
    ],
    A.flatten
  );
};