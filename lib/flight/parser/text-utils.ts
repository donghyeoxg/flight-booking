// lib/flight/parser/text-utils.ts

export function normalizeQuery(query: string) {
    return query
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }
  
  export function getContextAroundKeyword(
    text: string,
    keyword: string,
    radius = 14
  ) {
    const index = text.indexOf(keyword);
  
    if (index === -1) {
      return "";
    }
  
    const start = Math.max(
      0,
      index - radius
    );
  
    const end = Math.min(
      text.length,
      index + keyword.length + radius
    );
  
    return text.slice(start, end);
  }
  
  export function getIntensityMultiplier(
    context: string
  ) {
    const extremeWords = [
      "무조건",
      "제일",
      "가장",
      "최대한",
      "최우선",
      "절대",
      "겁나",
      "엄청",
      "무조건적으로",
    ];
  
    const strongWords = [
      "꼭",
      "많이",
      "매우",
      "진짜",
      "되도록이면",
      "중요해",
      "중요함",
    ];
  
    const weakWords = [
      "가능하면",
      "되면",
      "조금",
      "약간",
      "있으면 좋겠",
    ];
  
    if (
      extremeWords.some((word) =>
        context.includes(word)
      )
    ) {
      return 3;
    }
  
    if (
      strongWords.some((word) =>
        context.includes(word)
      )
    ) {
      return 2;
    }
  
    if (
      weakWords.some((word) =>
        context.includes(word)
      )
    ) {
      return 1.2;
    }
  
    return 1.5;
  }
  
  export function isLowImportanceContext(
    context: string
  ) {
    const expressions = [
      "상관없",
      "아무거나",
      "중요하지 않",
      "신경 안",
      "신경안",
      "관계없",
    ];
  
    return expressions.some((expression) =>
      context.includes(expression)
    );
  }
  
  export function applyPreferenceWeight(
    text: string,
    keywords: string[],
    currentWeight: number
  ) {
    for (const keyword of keywords) {
      if (!text.includes(keyword)) {
        continue;
      }
  
      const context =
        getContextAroundKeyword(
          text,
          keyword
        );
  
      if (
        isLowImportanceContext(context)
      ) {
        return currentWeight * 0.25;
      }
  
      const multiplier =
        getIntensityMultiplier(context);
  
      return currentWeight * multiplier;
    }
  
    return currentWeight;
  }