import { PrismaClient, Channel } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const recipients = await Promise.all([
    prisma.recipient.upsert({
      where: { id: "user-001" },
      update: {},
      create: { id: "user-001", email: "yogeshsahota72@gmail.com", phone: "+919876543210", name: "Yogesh" },
    }),
    prisma.recipient.upsert({
      where: { id: "user-002" },
      update: {},
      create: { id: "user-002", email: "bob@example.com", phone: "+919876543211", name: "Bob" },
    }),
    prisma.recipient.upsert({
      where: { id: "user-003" },
      update: {},
      create: { id: "user-003", email: "charlie@example.com", name: "Charlie" },
    }),
  ]);

  console.log(`Created ${recipients.length} recipients`);

  const templates = await Promise.all([
    prisma.template.upsert({
      where: { name: "welcome-email" },
      update: {},
      create: {
        name: "welcome-email",
        channel: Channel.email,
        subject: "Welcome to Notification Platform, {{name}}!",
        body: "Hello {{name}},\n\nWelcome to our platform! We're excited to have you on board.\n\nBest regards,\nThe Team",
      },
    }),
    prisma.template.upsert({
      where: { name: "otp-email" },
      update: {},
      create: {
        name: "otp-email",
        channel: Channel.email,
        subject: "Your OTP is {{otp}}",
        body: "Hello {{name}},\n\nYour one-time password is {{otp}}. It expires in 10 minutes.\n\nDo not share this with anyone.",
      },
    }),
    prisma.template.upsert({
      where: { name: "otp-sms" },
      update: {},
      create: {
        name: "otp-sms",
        channel: Channel.sms,
        subject: null,
        body: "Your OTP is {{otp}}. It expires in 10 minutes. Do not share.",
      },
    }),
    prisma.template.upsert({
      where: { name: "reset-password-email" },
      update: {},
      create: {
        name: "reset-password-email",
        channel: Channel.email,
        subject: "Password Reset Request",
        body: "Hello {{name}},\n\nClick the link below to reset your password:\n{{reset_link}}\n\nThis link expires in 1 hour.",
      },
    }),
    prisma.template.upsert({
      where: { name: "promo-sms" },
      update: {},
      create: {
        name: "promo-sms",
        channel: Channel.sms,
        subject: null,
        body: "Hey {{name}}! {{offer}}. Shop now at {{link}}",
      },
    }),
  ]);

  console.log(`Created ${templates.length} templates`);

  const userPrefs = await Promise.all([
    prisma.userPreference.upsert({
      where: { userId_channel: { userId: "user-001", channel: Channel.email } },
      update: {},
      create: { userId: "user-001", channel: Channel.email, optedIn: true },
    }),
    prisma.userPreference.upsert({
      where: { userId_channel: { userId: "user-001", channel: Channel.sms } },
      update: {},
      create: { userId: "user-001", channel: Channel.sms, optedIn: true },
    }),
    prisma.userPreference.upsert({
      where: { userId_channel: { userId: "user-002", channel: Channel.email } },
      update: {},
      create: { userId: "user-002", channel: Channel.email, optedIn: true },
    }),
    prisma.userPreference.upsert({
      where: { userId_channel: { userId: "user-002", channel: Channel.sms } },
      update: {},
      create: { userId: "user-002", channel: Channel.sms, optedIn: false },
    }),
    prisma.userPreference.upsert({
      where: { userId_channel: { userId: "user-003", channel: Channel.email } },
      update: {},
      create: { userId: "user-003", channel: Channel.email, optedIn: true },
    }),
    prisma.userPreference.upsert({
      where: { userId_channel: { userId: "user-003", channel: Channel.sms } },
      update: {},
      create: { userId: "user-003", channel: Channel.sms, optedIn: true },
    }),
  ]);

  console.log(`Created ${userPrefs.length} user preferences`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
