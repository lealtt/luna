export class ReDoSProtection {
  static isRegexSafe(pattern: string): { safe: boolean; reason?: string } {
    const dangerousPatterns = [
      { pattern: /(\.\*){2,}/, reason: "Multiple .* in sequence" },
      { pattern: /(\+\*|\*\+)/, reason: "Nested quantifiers" },
      { pattern: /(\(.*\)){3,}/, reason: "Deep nesting" },
    ];

    for (const { pattern: dangerous, reason } of dangerousPatterns) {
      if (dangerous.test(pattern)) {
        return { safe: false, reason };
      }
    }

    if (pattern.length > 500) {
      return { safe: false, reason: "Pattern too long" };
    }

    return { safe: true };
  }

  static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
