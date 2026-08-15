@AGENTS.md
# CLAUDE.md

# Project Overview

이 프로젝트는 Claude API를 사용하는 AI 캐릭터 채팅 웹앱 MVP이다.

현재 Next.js + TypeScript 기반이며 모바일 메신저 형태의 UI를 사용한다.

이 프로젝트의 핵심 목표는 단순한 AI 채팅이 아니라,
캐릭터가 고유한 성격을 유지하면서 현실의 시간 흐름을 인식하고,
사용자와 지속적인 관계를 형성하는 것처럼 느껴지게 만드는 것이다.

현재 단계에서는 production infrastructure보다
기능 검증, 안정성, 캐릭터 몰입감을 우선한다.


---

# 1. Source of Truth

같은 정보를 여러 파일에 중복 정의하지 않는다.

각 영역의 source of truth는 다음과 같다.

- 캐릭터 목록 / 성격 / 말투 / 이미지 / tagline / systemPrompt
  → `lib/characters.ts`

- 리마인더 요청 판별
  → `lib/reminderGuard.ts`

- 날짜 및 리마인더 시간 계산
  → `lib/time.ts`

- 캐릭터와 마지막 대화 이후 경과 시간 계산
  → `lib/interactionTime.ts`

- 메시지 / 리마인더 persistence
  → `lib/store.ts`

- proactive reminder 처리
  → `lib/scheduler.ts`

- 일반 채팅 및 reminder 생성 API 흐름
  → `app/api/chat/route.ts`

CLAUDE.md에는 위 파일들의 실제 데이터나 세부 캐릭터 설정을
불필요하게 복제하지 않는다.


---

# 2. Core Architecture Principle

## LLM과 deterministic logic을 분리한다.

Claude에게 시스템 상태나 정확한 계산을 맡기지 않는다.

Claude가 담당하는 것:

- 자연어 이해
- 캐릭터 답변 생성
- 캐릭터 personality 표현
- 리마인더 요청의 구조화된 정보 추출
- 서버가 제공한 시간 정보를 자연스럽게 표현

서버 코드가 담당하는 것:

- 현재 시각 확인
- 날짜 계산
- triggerAt 계산
- 경과 시간 계산
- 날짜 유효성 검사
- reminder 생성 여부 최종 판단
- duplicate 검사
- characterId 관리
- 상태 저장


예:

잘못된 방식:

Claude에게
"내일 오후 2시가 정확히 언제인지 계산해줘."

올바른 방식:

Claude:
relative_days = 1
hour = 14
minute = 0

서버:
실제 triggerAt 계산


이 원칙을 새로운 기능에서도 유지한다.


---

# 3. Character Architecture

모든 기능은 가능한 한 `characterId` 기반의 공통 시스템으로 구현한다.

새 캐릭터를 추가할 때 다음 기능을 복사하거나 캐릭터별로 따로 구현하지 않는다.

- reminder
- scheduler
- reminderGuard
- 날짜 계산
- Time Awareness
- store
- API route
- polling

캐릭터별 차이는 가능한 한 `lib/characters.ts`의 configuration과
systemPrompt를 통해 표현한다.

캐릭터 상세 성격, 말투, 시간 인식 스타일은
`lib/characters.ts`를 source of truth로 사용한다.

UI에서도 특정 캐릭터 ID를 하드코딩한 분기를 가능한 한 만들지 않는다.


---

# 4. Reminder System

리마인더는 이 프로젝트의 핵심 기능 중 하나다.

사용자는 미래 시점에 캐릭터가 특정 행동이나 발화를 하도록 요청할 수 있다.

예:

- "1분 뒤 알려줘"
- "10분 뒤 공부하라고 해줘"
- "1분 뒤 응원해줘"
- "1분 뒤 잔소리 좀 해줘"
- "내일 오후 2시에 알려줘"
- "모레 오전 9시에 말해줘"
- "3일 뒤 이 시간에 알려줘"
- "8월 20일 오후 3시에 알려줘"


현재 MVP에서 지원하지 않는 것:

- 반복 일정
- 매일 / 매주 / 매월 reminder
- 복잡한 캘린더 일정
- 다국가 timezone


현재 MVP의 시간 기준은 KST(Asia/Seoul)이다.


---

# 5. Reminder Safety Rules

Claude가 `schedule_reminder` tool을 호출했다고 해서
바로 Reminder를 생성해서는 안 된다.

Reminder 생성의 최종 권한은 서버에 있다.

현재 reminder 생성 파이프라인의 핵심 방어 구조를 유지한다.

개념적으로:

1. 현재 user message 확인
2. 미래 시간 표현 확인
3. 행동 / 발화 요청 여부 확인
4. `source_text`가 실제 current user message에서 나온 것인지 확인
5. extraction 검증
6. triggerAt 계산
7. 시간 유효성 검사
8. duplicate 검사
9. Reminder 생성


## 유령 리마인더 회귀 방지

과거에 다음 문제가 발생했다.

사용자:
"3분 뒤 알려줘"

→ 정상 reminder 등록
→ 정상 발화

이후 사용자:
"고마워"

그런데 Claude가 conversation history에 있던
과거 reminder 요청을 다시 읽고 새로운 Reminder를 등록했다.

이를 막기 위해 현재 다음 방어가 존재한다.

- `<current_user_message>` 구분
- reminder hard guard
- `source_text` 검증
- duplicate 검사

이 구조를 제거하거나 임의로 약화시키지 않는다.

특히 일반적인 후속 대화가 reminder를 생성하면 안 된다.

예:

- "고마워"
- "알려줘서 고마워"
- "됐어"
- "응"
- "이제 그만해"
- "다른 얘기하자"


Reminder 인식 범위를 넓힐 때도
false positive가 다시 증가하지 않는지 반드시 확인한다.


---

# 6. Reminder Natural Language Principle

Reminder를 단순히 "알려줘"라는 표현으로만 해석하지 않는다.

사용자가 명확한 미래 시점과 함께
그 시점에 캐릭터에게 행동이나 발화를 요청했다면
Reminder 요청으로 볼 수 있다.

예:

- "1분 뒤 응원해줘"
- "10분 뒤 잔소리 좀 해줘"
- "5분 뒤 힘내라고 말해줘"
- "내일 시험 잘 보라고 응원해줘"

하지만 시간이 없는 일반 요청은 Reminder로 만들지 않는다.

예:

- "응원해줘"
- "잔소리 좀 해줘"

이 경우 일반 대화로 처리한다.

Reminder guard를 수정할 때는
정상 요청을 더 많이 지원하면서도
유령 리마인더 방지 구조가 유지되는지 함께 검증한다.


---

# 7. Time Awareness

캐릭터는 사용자가 해당 캐릭터와 마지막으로 실제 대화한 이후
얼마나 현실 시간이 흘렀는지 인식할 수 있다.

시간 계산은 Claude가 하지 않는다.

서버가:

현재 시각
-
해당 characterId의 마지막 user message 시각

을 이용해 경과 시간을 계산한다.

Claude는 계산된 결과를 전달받아
캐릭터 personality에 맞게 표현한다.


예:

서버 계산:

days = 8
hours = 3
minutes = 40

Claude 표현:

캐릭터에 따라

"일주일 넘게 안 왔네."

또는

"8일하고 3시간 40분이나 지났네."

처럼 달라질 수 있다.


## Time Awareness threshold

현재 기준:

- 30분 미만
  → Time Awareness context 없음

- 30분 ~ 6시간
  → light

- 6시간 ~ 24시간
  → notable

- 1일 ~ 3일
  → several_days

- 3일 ~ 7일
  → long

- 7일 이상
  → very_long

실제 기준값의 source of truth는 `lib/interactionTime.ts`이다.


## 반복 언급 방지

사용자가 오랜만에 돌아온 첫 메시지에서 시간 경과를 언급한 뒤,
이어지는 모든 답변에서 같은 시간을 반복해서 말하지 않도록 한다.

현재 구조에서는 새 user message가 저장되면
다음 요청부터 last interaction gap이 짧아지기 때문에
Time Awareness context가 자연스럽게 비활성화된다.

이 구조를 불필요하게 복잡하게 만들지 않는다.


---

# 8. Time Awareness Development Override

실제 `Message.createdAt`을 테스트 목적으로 수정하지 않는다.

Time Awareness 테스트는 development-only override를 사용한다.