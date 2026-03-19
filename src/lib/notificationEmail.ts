import { supabase } from "@/integrations/supabase/client";

export const sendNotificationEmail = async (
  type: string,
  message: string,
  subject: string
) => {
  try {
    await supabase.functions.invoke("send-notification-email", {
      body: { type, message, subject },
    });
  } catch (err) {
    console.error("Failed to send notification email:", err);
  }
};
