import { emailNotificationRegistration, UserNotificationPreferences, UUID } from "./types";


export const getUserNotificationPreferences = (userId: UUID): UserNotificationPreferences => ({
    userId: userId,
    notificationRegistrations: [
      emailNotificationRegistration('abc@def.com')
    ]
});