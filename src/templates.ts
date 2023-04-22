
import * as O from "fp-ts/Option";
import { Option } from "fp-ts/Option";

import { CommandType, NotificationTemplate } from "./types";

const textNotificationEmailTemplate: NotificationTemplate = 
  {
    commandType: "SendTextNotificationCommand",
    registrationType: "EmailNotificationRegistration",
    template: "{{message}}"
  };

export const getTemplate = (commandType: CommandType): Option<NotificationTemplate> => {
  if (commandType == "SendTextNotificationCommand") {
    return O.some(textNotificationEmailTemplate)
  }
  return O.none;
}
