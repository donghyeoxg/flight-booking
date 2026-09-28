# TODO

## 다음 작업: Rule Parser → LLM Fallback 검증

현재 Rule Parser는 더 복잡하게 확장하지 않고, 명확한 문장은 직접 처리하고 애매하거나 복합적인 문장은 LLM Parser로 넘기는 구조로 발전시킨다.

### 1. Rule Parser가 처리해야 하는 문장 검증

- [ ] 단순하고 명확한 문장 테스트 세트 작성
- [ ] 가격 조건 정상 인식 확인
- [ ] 직항 조건 정상 인식 확인
- [ ] 정시성 / 공항 접근성 / 시간대 / 수하물 / 편안함 인식 확인
- [ ] 후지산 / A380 / 야경 / 노을 등 Experience 인식 확인
- [ ] 명확한 문장은 `shouldUseAI = false`가 되는지 확인

예시:

- `30만원 이하`
- `직항만`
- `저렴한 비행`
- `정시성이 중요해`
- `수하물이 중요해`
- `후지산 보이는 비행`
- `A380 타고 싶어`
- `30만원 이하 직항만`

### 2. LLM으로 넘겨야 하는 문장 검증

- [ ] 현재 Rule Parser가 이해하기 어려운 문장 테스트 세트 작성
- [ ] 애매하거나 복합적인 의도를 억지로 해석하지 않는지 확인
- [ ] 이런 문장에서 confidence가 낮아지는지 확인
- [ ] `shouldUseAI = true`가 정상적으로 설정되는지 확인

예시:

- `돈 좀 더 내더라도 덜 피곤한 편이 좋아`
- `몇 만원 차이면 편한 게 낫지`
- `엄마랑 가는 거라 너무 이르지 않고 편한 비행이면 좋겠어`
- `환승은 해도 되는데 기다리는 시간이 너무 길면 싫어`
- `회사 끝나고 탈 수 있고 도착도 너무 늦지 않았으면 좋겠어`
- `키가 커서 오래 타도 불편하지 않은 비행이면 좋겠어`

### 3. Parser 판정 기준 정리

목표:

Rule Parser가 모든 자연어를 이해하도록 만드는 것이 아니라,

- 명확한 문장 → Rule Parser
- 애매하거나 복합적인 문장 → LLM Parser

로 정확하게 분기하는 것.

검토할 값:

- `detectedPreferences`
- `confidence`
- `shouldUseAI`

### 4. 이후 작업

- [ ] Rule Parser 테스트 자동화
- [ ] 애매한 문장 약 30개 테스트 세트 구축
- [ ] LLM Parser 입력 / 출력 Schema 설계
- [ ] LLM Parser 구현
- [ ] Rule Parser + LLM Parser fallback 연결
- [ ] LLM 출력 validation 및 normalization
- [ ] 실제 항공편 데이터 API 연결 준비

## 목표 Architecture

User Query

→ Rule Parser

→ 충분히 이해 가능  
→ UserPreference

또는

→ 이해하기 어려움  
→ LLM Parser  
→ UserPreference

→ Hard Filters  
→ Flight Scoring  
→ Ranking