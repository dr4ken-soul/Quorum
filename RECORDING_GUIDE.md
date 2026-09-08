# Quorum Demo Video — Recording Guide

Everything you need to film the hackathon demo in one go. Follow this top to bottom.

---

## A. Before you press record

1. Plug the laptop into power (screen recording drains battery).
2. Turn on Focus assist / Do Not Disturb so no popups appear.
3. Close all other tabs and apps. You only need three windows:
   - A terminal (for the agent)
   - Supabase Table Editor (https://supabase.com/dashboard)
   - The Vercel site (https://web-psycho-projects.vercel.app)
4. Hide the bookmarks bar: press **Ctrl + Shift + B** in Chrome/Edge.
5. Do one silent dress rehearsal of the whole thing before filming for real.
6. **Never show the `.env` file, the Supabase dashboard settings page, or any key/password on screen.** Only the Table Editor (the data tables) is safe to show.

---

## B. Your Quorum iMessage number

**The Quorum number is +16287896792.** It is already live and opted in: texting it works both ways.

1. On your iPhone, save +16287896792 in Contacts as **Quorum**.
2. Start the agent and leave it running the whole time you are recording:

   ```
   npm run server
   ```

   Wait for the line `Quorum connected to Photon (Spectrum) - listening for iMessage.`
3. Use that saved Quorum thread for the whole recording. If the agent ever seems silent, send any message to the thread and check the terminal for the inbound.
4. If you ever start from a fresh Photon project (not needed for this recording): the shared-pool number only replies to people who have texted it first. Text it once from the iPhone, watch `meta.opt_in` flip to `true` in `npx -y @photon-ai/cli spectrum users ls --json`, and only then can the agent message out.

---

## C. Second phone: not compulsory

**You can film the whole demo with one iPhone.** The agent accepts a vouch from whoever sends it, including you, so this solo script works end to end and lands a PAY verdict.

A second person is only a bonus, and only if you can all share one group chat with the agent. On the Free plan the shared pool may not support group chats, so before filming test it: add the agent and one friend to a group, send one message, and see if it arrives. If it does not arrive, just use the solo script. Do not waste recording time on it.

---

## D. The message script

Send these **from your iPhone to the Quorum number**, one at a time, waiting for each reply before sending the next.

| # | Who | Message to send | What happens |
|---|-----|-----------------|--------------|
| 1 | You | `hey everyone, flats are booked! send £40 to Maya now so i can confirm the booking` | The agent notes the payment request. It should not trial this alone. |
| 2 | You | `put this on trial` | Case opens. The agent confirms and starts collecting testimony. |
| 3 | You (solo) or friend (group) | `vouch — i found the flat, maya booked it, i saw the confirmation` | Vouch recorded. With support plus a vouch the agent returns a **PAY** verdict. |
| 4 | You | `show work` | The agent replies with the full case record: request, testimonies, verdict and reasoning. |
| 5 | Optional | `object — the account name changed this week` | Verdict flips to **WALK AWAY** (or a pause) because there is now an objection. Use only if you have time. |
| 6 | Optional | `reopen the case` | Resets so you can re-run if a take goes wrong. |

If you mistype and get "I did not recognise a command..." back, just resend the exact command text from the table.

Keep messages 1–3 on camera-ready timing: you send them off camera, but the *replies* arriving are what the Supabase shots prove.

---

## E. Recording (one continuous take, ~3 minutes)

Open **Snipping Tool** → **Record** tab → **New** → select the full screen → **Start**. The microphone stays off, which is what you want (silent video, no voice needed).

1. **Terminal first.** In the terminal, from `...\Agents\iMessage\app`, run `npm run server` (start the server BEFORE recording so the banner is already up; just show it). Hold on the banner: `Quorum connected to Photon (Spectrum) - listening for iMessage.` — 5 seconds.
2. **Supabase, empty.** Switch to the Supabase Table Editor. Show `cases` and `verdicts` empty. — 5 seconds.
3. **Off camera:** unlock your iPhone and send messages 1, 2 and 3 from section D, waiting for each reply. Then wait about 20 seconds for everything to write to the database.
4. **Supabase, full.** Refresh the Table Editor. Scroll slowly through `cases` → `case_messages` → `testimonies` → `verdicts` so the viewer sees the rows appear. — 15 seconds.
5. **Off camera:** send message 4 (`show work`) and wait for the reply on your phone.
6. **The site.** Open https://web-psycho-projects.vercel.app and scroll slowly from top to bottom, then go to `/demo` (CASE 0047 / THE WEEKEND FLAT) and scroll through it. — 15 seconds.
7. Stop the recording.

---

## F. Finishing

- Trim the dead air off both ends.
- Use the **Photos** app or **Clipchamp** on Windows to trim and export as **MP4**.
- Name it clearly, e.g. `quorum-demo.mp4`.

---

## G. Don'ts

- Never show `.env`, the Supabase project settings, connection strings, API keys, or the Vercel dashboard.
- Never show your own phone number in full if you can avoid it (blur in the trim if needed).
- Don't restart the server mid-recording; it should already be running when you start filming.
- Don't narrate over it; silent is fine, captions/edited VO come later.
- If a take fails, don't patch it. Run `reopen the case`, wait for the tables to clear a beat, and start the take again from the top.
