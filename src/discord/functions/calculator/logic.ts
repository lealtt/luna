import type { CalculatorStateData } from "#states";

const precedence: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

function isOperator(token: string): boolean {
  return token in precedence;
}

function applyOperation(operators: string[], values: number[]): void {
  const operator = operators.pop();
  const right = values.pop();
  const left = values.pop();

  if (left === undefined || right === undefined || !operator) {
    values.push(NaN);
    return;
  }

  switch (operator) {
    case "+":
      values.push(left + right);
      break;
    case "-":
      values.push(left - right);
      break;
    case "*":
      values.push(left * right);
      break;
    case "/":
      values.push(right === 0 ? NaN : left / right);
      break;
  }
}

function evaluateExpression(expression: string): number {
  const tokens = expression.match(/(\d+\.?\d*)|[+\-*/()]/g);
  if (!tokens) return NaN;

  const values: number[] = [];
  const operators: string[] = [];

  for (const token of tokens) {
    if (!isNaN(parseFloat(token))) {
      values.push(parseFloat(token));
    } else if (token === "(") {
      operators.push(token);
    } else if (token === ")") {
      while (operators.length && operators[operators.length - 1] !== "(") {
        applyOperation(operators, values);
      }
      operators.pop();
    } else if (isOperator(token)) {
      while (operators.length && precedence[operators[operators.length - 1]] >= precedence[token]) {
        applyOperation(operators, values);
      }
      operators.push(token);
    }
  }

  while (operators.length) {
    applyOperation(operators, values);
  }

  return values.pop() ?? NaN;
}

export function processCalculatorKey(state: CalculatorStateData, key: string): CalculatorStateData {
  let { display, expression, overwrite } = { ...state };
  const lastChar = expression.trim().slice(-1);

  if (/\d/.test(key)) {
    if (overwrite) {
      display = key;
      expression = key;
    } else {
      display = display === "0" ? key : display + key;
      expression = expression === "0" ? key : expression + key;
    }
    overwrite = false;
  } else if (key === ".") {
    if (overwrite) {
      display = "0.";
      expression = "0.";
      overwrite = false;
    } else if (!display.includes(".")) {
      display += ".";
      expression += ".";
    }
  } else if (["+", "-", "*", "divide"].includes(key)) {
    const opSymbol = key === "divide" ? "/" : key;
    if (isOperator(lastChar)) {
      expression = expression.slice(0, -2) + ` ${opSymbol} `;
    } else {
      expression += ` ${opSymbol} `;
    }
    display = "0";
  } else if (key === "(") {
    if (overwrite || expression === "0") {
      expression = "( ";
    } else if (isOperator(lastChar) || lastChar === "(") {
      expression += "( ";
    } else {
      expression += " * ( ";
    }
    display = "0";
    overwrite = false;
  } else if (key === ")") {
    if (!isOperator(lastChar) && lastChar !== "(") {
      expression += " )";
      display = "0";
    }
  } else if (key === "=") {
    try {
      const result = evaluateExpression(expression);
      display = String(isNaN(result) ? "Error" : result);
      expression = display;
      overwrite = true;
    } catch {
      display = "Error";
      expression = "Error";
      overwrite = true;
    }
  } else if (key === "clear") {
    display = "0";
    expression = "0";
    overwrite = true;
  }

  if (display.length > 22) display = "Error";
  if (expression.length > 42) expression = "Expression too long";

  return { ...state, display, expression, overwrite };
}
