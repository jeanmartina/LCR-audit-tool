# v1.1 Research: Pitfalls

## 1. Mixing auth and authorization responsibilities

Risk:
- treating OAuth login as if it already defines application authorization

Why it fails:
- providers authenticate identity, but this product still needs app-owned groups, invites, and roles

Prevention:
- keep groups/memberships/roles in the app database
- let OAuth/OIDC map identities to existing invited users instead of becoming the source of truth for authorization

## 2. Modeling group scope directly on targets

Risk:
- adding a single `group_id` to targets even though targets must be shareable across groups

Why it fails:
- it blocks sharing, duplicative views, and clean membership logic

Prevention:
- use a share/join model for target visibility across groups

## 3. Letting UI filters enforce security

Risk:
- reading all data first and filtering by group in the page layer

Why it fails:
- exports, background jobs, or alternate routes can bypass that UI filtering

Prevention:
- enforce authorization in shared query/read paths and route guards

## 4. Keeping i18n as a late string-replacement pass

Risk:
- adding translations only after the UI is already hardcoded everywhere

Why it fails:
- retrofitting i18n into App Router/server component code is expensive and error-prone

Prevention:
- move all new UI copy to message catalogs from the start of the milestone
- define one locale strategy early

## 5. Forgetting HTTPS constraints for OAuth/OIDC

Risk:
- designing auth flows as if plain local URLs are enough for production-ready provider support

Why it fails:
- callback URLs and public origins become the blocker late in the milestone

Prevention:
- make HTTPS/public-origin configuration part of the milestone requirements, not deployment afterthought
- package Caddy and callback configuration as core deliverables

## 6. Import UX without auditability

Risk:
- importing certificate bundles without tracking what was uploaded, what was parsed, and what derived targets were created

Why it fails:
- operators cannot understand or trust what the system did

Prevention:
- persist import jobs, results, errors, and derived-target lineage
- show import history in the admin UI

## 7. Overloading a single admin screen

Risk:
- putting certificate upload, target editing, tags, alert routing, sharing, defaults, and history into one giant page

Why it fails:
- the product becomes hard to use and harder to authorize correctly

Prevention:
- separate flows:
  - import/onboard
  - inspect/manage
  - share/access
  - defaults/settings

## 8. Tying worker execution to the web process

Risk:
- keeping polling/import background execution inside the web runtime for convenience

Why it fails:
- it harms reliability and complicates scaling later

Prevention:
- keep worker/scheduler as a separate service already in `v1.1`

## 9. Locale stored only in browser state

Risk:
- language resets per device/session and becomes inconsistent across users and invites

Why it fails:
- the requirement says locale must be configurable per user

Prevention:
- persist locale in a user preference record and apply it after authentication
