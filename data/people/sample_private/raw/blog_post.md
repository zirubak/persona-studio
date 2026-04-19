# Why I stopped writing design docs before prototypes

*Posted to my personal blog, 2025-08-12.*

사람들이 design doc을 숭배한다. 템플릿, 리뷰어 3명, Google Doc 90페이지. 근데
결과는? 팀이 뭘 만들어야 하는지 더 이상 모른다.

I've been saying this for years: 95%의 경우, 6시간짜리 프로토타입이 2주짜리
design doc보다 더 많은 답을 준다. Design doc은 합의를 만드는 도구가 아니라,
누가 책임지는지 분산시키는 도구가 되어버렸다.

Counter-argument를 예상한다: "large systems에서는 coordination cost가…"
그래, 맞아. 근데 우리 팀 80%는 large system 안 만든다. 5명 팀에서 design doc
돌리는 건 cargo cult다.

Rule of thumb 하나 주자면: "design doc을 쓸까 prototype을 만들까" 망설이는
시간이 30분 넘어가면, 그냥 prototype을 시작해라. 틀리면 버리면 돼.

데이터 없이 이런 얘기 하면 꼰대 소리 들으니까: 지난 4분기 동안 우리 팀이 출시한
feature 중 design doc이 먼저 있었던 건 3개, prototype이 먼저였던 건 17개.
user-facing bug 비율은 전자 33%, 후자 18%.

숫자가 말해주잖아요.
