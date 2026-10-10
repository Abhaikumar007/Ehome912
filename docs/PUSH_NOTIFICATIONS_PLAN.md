# Push Notifications Plan (TO DO AFTER PROJECT IS FINISHED)

Status: **Not started.** Saved on 2026-10-04 to implement later.

## Goal
Send targeted push notifications to students. Never send to every class unless the content is meant for "All Classes".

| Event | Who receives it |
|---|---|
| Broadcast announcement | Only the targeted class or student ("All Classes" = everyone) |
| Fee due reminder | That one student, **5 days before** their due date (the day of the month they joined / registered) |
| Timetable published | Only students of **that timetable's class** |

## Current state of the project
- Expo SDK ~57, React Native 0.86, Android/iOS id `com.eduhome.app`
- Students currently use **Expo Go only** (no standalone build)
- No `expo-notifications`, no push token storage, no `eas.json`
- Supabase is in use (`fees_records`, `announcements`, timetable tables, etc.)
- No Firebase project exists yet

## Prerequisites (do these first)
1. **Firebase project** (free): add Android app with package `com.eduhome.app`, download `google-services.json`, upload the FCM key to Expo (`eas credentials`).
2. **Standalone build**: Android push does not work in Expo Go on SDK 53+. Add `eas.json` and run `eas build -p android --profile preview` to get an installable APK.
3. iPhones would additionally need an Apple Developer account.

## Architecture
**Database (run the SQL in the Supabase dashboard)**
- `push_tokens`: `roll_no`, `class`, `token`, `updated_at` (a student may have several devices)
- `notification_log`: `roll_no`, `type`, `ref` (e.g. `fee-2026-10`), `sent_at`. Used to avoid duplicate sends.

**Sending: Supabase Edge Function `send-push`**
- Takes a list of target tokens plus title/body/data and posts to `https://exp.host/--/api/v2/push/send`.
- Never call the push API from the browser with a secret.

**Triggers**
1. **Announcements**: database webhook on insert into `announcements`. Resolve the target (class / student / all) to tokens, then send.
2. **Timetable published**: webhook on publish. Look up tokens where `push_tokens.class` equals the timetable's class.
3. **Fee reminder**: daily `pg_cron` job. For each student whose due date minus today equals 5 days and who has an unpaid month, send "Fee of Rs X is due on <date>". Record it in `notification_log` so it is sent once.

**App (`eduhome-app`)**
- Add `expo-notifications`.
- After login: ask permission, get the Expo push token, upsert it into `push_tokens` with `roll_no` and `class`.
- Tapping a notification deep-links to Timetable / Fees / Announcements.

## Open check before coding
- Confirm which `announcements` column holds the target (class vs student) so targeting is exact.

## Suggested order
1. SQL tables, 2. Edge Function, 3. App token registration + `eas.json`, 4. Announcement trigger, 5. Timetable trigger, 6. Fee reminder cron, 7. Test with the APK.
