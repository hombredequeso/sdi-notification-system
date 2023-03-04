
export type UUID = string;
export type EmailAddress = string;
export type SmsPhoneNumber = string;
export type AndroidDeviceId = string;
export type IosDeviceId = string;

// Commands, for sending different sorts of notifications

export type SendTextNotificationCommand = {
  message: string;
  userId: UUID;
};


export type SendOrderDispatchedCommand = {
  order: OrderDispatched;
  userId: UUID;
};

export type OrderDispatched = {
  orderId: string;
  orderSummary: string;
  dispatchDate: string;
  message: string;
};


export type CommandType = "SendTextNotificationCommand" | "SendOrderDispatchedCommand";

// Different methods of notification

export type EmailNotification = { emailAddress: EmailAddress; body: string };
export type SmsNotification = { phoneNumber: SmsPhoneNumber; text: string };
export type AndroidNotification = { deviceId: AndroidDeviceId; message: string };
export type IosNotification = { deviceId: IosDeviceId; message: string };

export type Notification =
  | EmailNotification
  | SmsNotification
  | IosNotification
  | AndroidNotification;


// User preferences - what method of notification to use
export type UserNotificationPreferences = {
  userId: UUID;
  notificationRegistrations: NotificationRegistration[];
};

export type NotificationRegistration =
  | EmailNotificationRegistration
  | SmsNotificationRegistration
  | AndroidNotificationRegistration
  | IosNotificationRegistration;

export type NotificationRegistrationType =
  | "EmailNotificationRegistration"
  | "SmsNotificationRegistration"
  | "AndroidNotificationRegistration"
  | "IosNotificationRegistration"

export type EmailNotificationRegistration = {
  _type: NotificationRegistrationType;
  emailAddress: EmailAddress;
};
export const emailNotificationRegistration = (
  emailAddress: EmailAddress
): EmailNotificationRegistration => ({
  _type: "EmailNotificationRegistration",
  emailAddress: emailAddress,
});

export const isEmailNotificationRegistration = (
  n: NotificationRegistration
): n is EmailNotificationRegistration =>
  n._type === "EmailNotificationRegistration";

export type SmsNotificationRegistration = {
  _type: NotificationRegistrationType;
  phoneNumber: SmsPhoneNumber;
};

export const smsNotificationRegistration = (
  phoneNumber: SmsPhoneNumber
): SmsNotificationRegistration => ({
  _type: "SmsNotificationRegistration",
  phoneNumber: phoneNumber,
});

export const isSmsNotificationRegistration = (
  n: NotificationRegistration
): n is SmsNotificationRegistration =>
  n._type === "SmsNotificationRegistration";

export type AndroidNotificationRegistration = {
  _type: NotificationRegistrationType;
  android: AndroidDeviceId;
};
export const androidNotificationRegistration = 
  (android: AndroidDeviceId): AndroidNotificationRegistration => ({
  _type: "AndroidNotificationRegistration",
  android: android,
});

export type IosNotificationRegistration = {
  _type: NotificationRegistrationType;
  ios: IosDeviceId;
};
export const iosNotificationRegistration = 
  (ios: IosDeviceId): IosNotificationRegistration => ({
  _type: "IosNotificationRegistration",
  ios: ios,
});

// Template for a notification:
//  For a given commandType, and method of notification (NotificationRegistrationType),
//  use this template.
export type NotificationTemplate = {
  commandType: CommandType;
  registrationType: NotificationRegistrationType;
  template: string;
};


// Errors:

export type TemplateDoesNotExist = {
  commandType: CommandType;
  registrationType: NotificationRegistrationType;
};
