# Supabase 편지함 연결

코드 준비와 실제 서비스 연결은 별도입니다. 데이터베이스·서버 환경 변수·검수 워커를 연결하고 두 익명 세션 간 전달을 확인하기 전에는 실제 편지 서비스가 준비되었다고 볼 수 없습니다. 연결 전 화면은 명시적으로 표시된 체험 모드이며 글을 보내지 않습니다.

## 1. 프로젝트와 익명 인증

- 프로젝트 URL: `https://ieywwzmukaapajamcbxm.supabase.co`
- Supabase → Authentication → Sign In / Providers → Anonymous Sign-Ins → Enable → Save.
- 익명 세션은 서버가 HttpOnly, Secure, SameSite=Lax 쿠키로 유지합니다. 브라우저 데이터를 지우거나 기기를 바꾸면 기존 익명 편지함을 찾을 수 없습니다. 브라우저 핑거프린트와 원시 IP를 별도로 수집하지 않습니다. 다른 사용자에게 익명이지만 운영 인프라까지 완전한 익명성을 보장하는 서비스는 아닙니다.
- 공개 서비스 전 Supabase 익명 인증의 IP별 레이트 리밋을 확인하세요. CAPTCHA를 활성화하려면 실제 CAPTCHA 토큰을 받는 위젯 연동을 먼저 추가해야 합니다. 현재 UI는 CAPTCHA 위젯이 없으므로 이를 켜면 익명 세션 생성이 거절됩니다. 쿠키 초기화로 새 익명 계정을 만드는 우회까지 해결됐다고 주장하지 않습니다.

## 2. SQL 테이블과 함수

Supabase → SQL Editor → New query에서 `supabase/migrations/202611020001_letters.sql`의 전체 내용을 붙여 넣고 Run합니다. 한 트랜잭션으로 테이블, 권한, RLS, RPC가 생성됩니다. **최초 실행용 파일**이므로 성공 후 같은 파일을 다시 실행하지 않습니다.

Table Editor에 `letter_users`, `letter_requests`, `reply_letters`, `reply_reactions`, `user_blocks`, `letter_reports`, `letter_moderation_jobs`가 생성됐는지 확인합니다. 브라우저 역할에 원본 테이블 SELECT/INSERT/UPDATE 권한을 추가하지 않습니다.

## 3. Vercel 환경 변수

Vercel → 프로젝트 nondoing-238b → Settings → Environment Variables에서 다음을 입력합니다. 저장 후 Redeploy해야 기존 배포에 적용됩니다.

| 이름 | 값/위치 |
|---|---|
| `SUPABASE_URL` | `https://ieywwzmukaapajamcbxm.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Settings → API Keys → Legacy anon key. 서버에서만 사용합니다. |
| `SUPABASE_SERVICE_ROLE_KEY` | 같은 화면의 Legacy service_role key. 비밀키이며 브라우저/채팅/GitHub에 올리지 않습니다. |
| `LETTER_MODERATION_API_KEY` | 검수용 OpenAI API 키. 서버만 `api.openai.com`에 전송하며 API 사용 요금이 발생할 수 있습니다. |
| `LETTER_MODERATION_MODEL` | `gpt-4.1-mini` (선택) |
| `CRON_SECRET` | 32자 이상의 충분히 긴 무작위 문자열. 다음 단계 Vault 값과 동일하게 설정합니다. |
| `LETTERS_ENABLED` | 처음에는 `false`. 워커·검수 운영 준비가 끝나면 `true`로 바꾸고 Redeploy합니다. |

새 Supabase publishable/secret 키와 Legacy JWT 키는 서로 다른 형태입니다. 현재 서버는 Legacy anon/service_role 키를 사용하도록 작성되어 있으므로 `sb_secret_...` 값을 service_role JWT로 대체하지 마세요. `apikey`와 Authorization 처리 방식을 바꾸지 않고 혼용하면 연결되지 않습니다.

이 채팅의 클라우드 환경 설정에 값을 넣는 것과 **Vercel 서버의 환경 변수**에 값을 넣는 것은 별도입니다. 현재 설정 도구는 Vercel 프로젝트에 비밀값을 자동 복사하지 않습니다.

## 4. 지연 전달 워커

Supabase Extensions에서 `pg_cron`과 `pg_net`을 활성화하고 Vault에서 `non_doing_cron_secret`이라는 비밀 항목을 만듭니다. 값은 Vercel의 `CRON_SECRET`과 동일해야 합니다. 값 자체를 SQL/GitHub에 적지 않습니다.

`supabase/schedule-worker.sql`을 SQL Editor에서 한 번 실행합니다. 매분 Vercel의 인증된 `/api/letter-worker`를 호출합니다. Vercel Hobby의 일일 cron에 의존하지 않습니다. Supabase Cron 실행 이력과 pg_net 응답에서 200 응답을 확인합니다. 인증 없는 수동 방문에서 401이 나오는 것은 정상입니다.

워커는 승인된 편지를 전달하고 대기 글 2개를 병렬 검수합니다. 승인 후 임의의 5–20분을 기다리며, 실제 도착에는 분 단위 작업 주기에 따른 시간이 더해질 수 있습니다. API 오류 시 승인하지 않고 재시도하며 5회 실패하면 사람 검수로 격리합니다. 조회·모델·수동 검수 큐가 밀리면 접수부터 도착까지 더 오래 걸릴 수 있습니다.

## 5. 운영자 검수

중간 점수·위기 신호·검수 실패는 `QUARANTINED` 상태로 남습니다. 자동 승인으로 우회하지 않습니다. 실제 검수 담당자가 필요하며, 현재 별도의 관리자 웹앱은 없습니다. 권한 있는 운영자가 Supabase의 관리 화면/SQL Editor에서 격리된 사연·답장과 신고를 검토합니다.

- 사연 승인: `select public.letter_human_review(p_request := '검토한 UUID', p_approve := true);`
- 답장 승인: `select public.letter_human_review(p_reply := '검토한 UUID', p_approve := true);`
- 거절은 `p_approve := false`로 실행합니다. 수신자 차단과 발신자 상태는 실제 전달 시 다시 확인합니다.

원문은 민감한 고민일 수 있습니다. 검수 권한, 이용 안내, 보존/삭제 기간, 신고 처리 담당자를 정한 뒤 공개 기능을 켭니다. 지우기 버튼은 수신자 화면에서 숨기고 작성자를 차단하며, 신고 검토를 위한 제한된 기록은 남습니다. 이를 모든 원본의 영구 삭제라고 표시하지 않습니다. 위험 점수와 패턴 검사는 보조 수단이며 유해 메시지를 완전히 차단한다고 보장하지 않습니다.

## 6. 연결 후 실제 확인

1. 서로 다른 브라우저 세션 A/B를 열어 편지함을 엽니다.
2. A가 사연을 남기고 작업 실행 후 B의 응원 탭에 나타나는지 확인합니다.
3. B가 답장을 접수했을 때 티켓이 한 장만 차감되는지 확인합니다.
4. 승인 직후 A에게 보이지 않고, deliver_after 이후 작업 실행으로 A의 편지함에 나타나는지 확인합니다.
5. A의 감사 스티커는 한 번만 저장되고 글 재답장 기능이 없는지 확인합니다.
6. 신고·차단 후 해당 작성자의 기존 및 이후 편지가 보이지 않는지 확인합니다.
7. 무인증 API, 다른 수신자의 편지 ID, 만료 세션과 서버 검수 실패가 전송을 허용하지 않는지 확인합니다.

현재 로컬 PostgreSQL 테스트는 권한, 길이, 중복/자기 답장, 원자적 티켓 차감, 최대 3개 답장 예약, 검수 lease, 승인/지연 전달, 스티커, 차단과 검수 실패 격리를 검증합니다. 실제 Supabase 프로젝트와 OpenAI 호출, 스케줄, 배포된 두 세션 교환을 검증한 결과와 구분해야 합니다.
