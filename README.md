# HealthCalendar

[![CI](https://github.com/IsaVII/HealthCalendar/actions/workflows/ci.yml/badge.svg)](https://github.com/IsaVII/HealthCalendar/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/IsaVII/HealthCalendar/actions/workflows/deploy.yml/badge.svg)](https://github.com/IsaVII/HealthCalendar/actions/workflows/deploy.yml)

A private, mobile-friendly web app for keeping track of how you feel day by day —
built to help spot patterns behind recurring headaches, migraines, poor sleep or
low energy.

**👉 Open it here: https://isavii.github.io/HealthCalendar/**

Available in English, Swedish and German, with a light and a dark theme.

## What you can track

Each day you fill in as much or as little as you want, grouped into collapsible
sections:

- **Meals & nutrition** – breakfast, lunch, dinner, snacks, water / unsweetened
  tea, caffeine, alcohol, sugar, supplements
- **Body metrics** – weight, height, BMI (calculated for you), blood pressure,
  resting heart rate, temperature, blood glucose
- **Sleep** – bedtime, wake time, hours, quality, awakenings, a free-text note
- **Activity** – exercise type and duration, intensity, steps, how you felt after
- **Symptoms & pain** – a pain score, plus a detailed headache / migraine log:
  type, location, intensity, accompanying symptoms, suspected triggers, and
  whether the relief you took helped
- **Medication** – tick off the medicines you took today from your own list
- **Mood & energy** – mood, stress, anxiety, energy through the day, focus
- **Menstrual cycle** – period, flow, PMS symptoms, ovulation signs
- **Environment & triggers** – weather, air pressure, pollen, screen time, noise,
  light, strong smells, dehydration
- **Illness & appointments** – sick days, doctor / dentist visits, injuries,
  vaccinations
- **Habits** – daily yes/no checklist (no smoking, outdoor time, meditation, …)

## How to use it

1. Open the link above and **create an account** (you'll get a confirmation
   email — click the link in it).
2. On the **Health** page, pick a date and fill in your day. A green dot on a
   section header shows it has something in it. Your entry saves when you press
   **Save**.
3. The **Calendar** shows the month or year at a glance, with each day coloured
   by your pain level, so streaks and bad patches stand out.
4. In **Settings** you can:
   - add the medications you take regularly, so they show up as a quick checklist
     on the daily entry
   - hide any sections or fields you don't need (e.g. turn off caffeine or the
     cycle section) to keep the page short

## Your data

Every entry is tied to your account and visible only to you — the database
enforces this per-row, so no other user can read your data. You can log in from
your phone or computer and see the same history.

---

\*Built with React and Supabase.
