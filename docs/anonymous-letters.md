# Anonymous letters — integration design

This design is implemented in the Supabase migration, Vercel API and protected worker. The external Supabase/OpenAI credentials and worker schedule still need configuration before real delivery. See supabase-setup.md.

## Place in the tea room

A wooden letter box opens three views: leave a story, offer support, and read received letters. There is no text reply to a received support letter, only one gratitude sticker, report/hide and block. The room, uploaded ambience, and private 60-second thought ritual remain available without using letters. Private ritual thoughts are never automatically posted as letter requests.

## Backend requirements

Use PostgreSQL with anonymous authentication. Public anonymity means other visitors do not see identity; device fingerprints and IP subnets do not establish complete anonymity. Prefer an anonymous server-issued user UUID and HttpOnly session over intrusive browser fingerprinting. If network-abuse metadata is retained, derive it on the server, restrict its access, and define retention before enabling it. No user IDs, trust scores, moderation reasons, or internal risk metadata are writable by the browser.

The server must enforce, regardless of client-side checks:

- Normalize Unicode and count non-whitespace Unicode code points. Stories: 50–300, replies: 50–400.
- Allowed category/status/sticker values; no self-reply, duplicate replies or self-block.
- The reply recipient must match the request's actual author; a CHECK comparing sender and recipient alone is insufficient.
- Lock the request row when reserving one of its three reply slots, and lock/update sender quota atomically. Concurrent submissions cannot exceed reply_limit or spend the last ticket twice.
- Check block relationships in both directions when listing requests, submitting replies, and delivering letters.
- Default moderation_status consistently to PENDING. Use PENDING, APPROVED, QUARANTINED, SHADOW_REJECTED and DELIVERED as distinct states, with a documented retry/expiry policy.
- Client paste restrictions are optional UX friction and do not replace server limits, deduplication or moderation. They can also affect assistive workflows.

## Moderation and delayed delivery

1. Authenticate; verify quota/trust/cooldown, length, category and idempotency key.
2. Server-side normalization and conservative pattern checks for contact information, external links, financial solicitation and abusive variants. Avoid treating ordinary mentions of a bank or phone as proof of abuse.
3. An authenticated moderation worker classifies context in both the story and reply. Unavailable or ambiguous analysis stays in review; it must not silently approve. Suggested bands: <= .20 queue; <= .60 human review; > .60 quarantine. Scores are routing signals, not a guarantee that a message is safe.
4. Adopt 5–20 minutes as the single cooling-off range (the proposed text contains conflicting ranges). Set deliver_after only after approval. A scheduled, authenticated worker queries eligible rows using row locks and SKIP LOCKED, rechecks blocks and risk state, then delivers transactionally.
5. Expose only delivered, approved, non-hidden messages to the intended recipient. A common acknowledgment says the letter was received for review, not that it reached another user.

Human review requires an actual private moderator interface and authorized moderators. A queue without a reviewer is not a completed moderation system. Unreviewed messages stay undelivered.

## Crisis support

A crisis indicator opens supportive help information, separate from judgments about the writer. In the Korean UI use 109 (suicide prevention support); immediate danger can use 112/119. Do not present old 1393 information as a current primary number. Do not promise that keyword matching detects every crisis.

## Gratitude, hiding and reporting

Enforce one gratitude sticker per received letter on the server, owned by the actual recipient. Keep ticket policy and timezone explicit; never change trust or grant tickets based on client-supplied values. Reports hide the letter from the reporter immediately and create a block and review record atomically. User-visible deletion and limited, access-controlled evidence retention for moderation are different operations; do not promise permanent data erasure while keeping an audit record.

## Still needed before a real release

Database and authentication project, server-only credentials, moderation provider/configuration, human review ownership, and an authenticated scheduled worker. The deployed UI must identify a local demonstration as such and must not fabricate letters from real users or successful deliveries.
