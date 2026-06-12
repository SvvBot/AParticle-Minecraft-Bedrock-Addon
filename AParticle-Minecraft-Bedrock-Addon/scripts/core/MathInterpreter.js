import { StackPool } from './ObjectPool.js';

// Supported operators and functions
const PRECEDENCE = {
    '+': 2,
    '-': 2,
    '*': 3,
    '/': 3,
    '^': 4
};
const RIGHT_ASSOCIATIVE = { '^': true };
const MATH_FUNCS = new Set([
    'sin', 'cos', 'tan', 'sqrt', 'abs', 'pow', 'floor', 
    'ceil', 'round', 'log', 'exp', 'atan2', 'min', 'max'
]);

export class MathInterpreter {
    
    /**
     * Tokenizes a mathematical expression string.
     * Case-insensitive for functions and variables.
     * @param {string} expr 
     * @returns {Array<{type: string, value: string|number}>}
     */
    static tokenize(expr) {
        const tokens = [];
        let i = 0;
        
        while (i < expr.length) {
            let char = expr[i];

            if (/\s/.test(char)) {
                i++;
                continue;
            }

            // Numbers
            if (/\d|\./.test(char)) {
                let numStr = '';
                let hasDot = false;
                while (i < expr.length && (/\d/.test(expr[i]) || (expr[i] === '.' && !hasDot))) {
                    if (expr[i] === '.') hasDot = true;
                    numStr += expr[i];
                    i++;
                }
                tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
                continue;
            }

            // Letters (Functions, Variables, Constants)
            if (/[a-zA-Z]/.test(char)) {
                let str = '';
                while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
                    str += expr[i];
                    i++;
                }
                str = str.toLowerCase(); // Case-insensitive handling!

                if (str === 't') {
                    // Implicit multiplication: e.g. "2t" -> "2 * t"
                    if (tokens.length > 0 && (tokens[tokens.length - 1].type === 'NUMBER' || tokens[tokens.length - 1].type === 'RPAREN')) {
                        tokens.push({ type: 'OPERATOR', value: '*' });
                    }
                    tokens.push({ type: 'VARIABLE', value: 't' });
                } else if (str === 'pi') {
                    tokens.push({ type: 'NUMBER', value: Math.PI });
                } else if (str === 'e') {
                    tokens.push({ type: 'NUMBER', value: Math.E });
                } else if (MATH_FUNCS.has(str)) {
                    // Implicit multiplication: e.g. "2sin" -> "2 * sin"
                    if (tokens.length > 0 && (tokens[tokens.length - 1].type === 'NUMBER' || tokens[tokens.length - 1].type === 'RPAREN')) {
                        tokens.push({ type: 'OPERATOR', value: '*' });
                    }
                    tokens.push({ type: 'FUNCTION', value: str });
                } else {
                    throw new Error(`Unknown function or variable: ${str}`);
                }
                continue;
            }

            // Operators
            if ('+-*/^'.includes(char)) {
                // Check for unary minus
                if (char === '-' && (tokens.length === 0 || tokens[tokens.length - 1].type === 'LPAREN' || tokens[tokens.length - 1].type === 'COMMA' || tokens[tokens.length - 1].type === 'OPERATOR')) {
                    // Represent unary minus as a special operator or just push a 0 before it
                    tokens.push({ type: 'NUMBER', value: 0 }); 
                }
                tokens.push({ type: 'OPERATOR', value: char });
                i++;
                continue;
            }

            if (char === '(') {
                // Implicit multiplication: e.g. "2(" -> "2 * ("
                if (tokens.length > 0 && (tokens[tokens.length - 1].type === 'NUMBER' || tokens[tokens.length - 1].type === 'VARIABLE' || tokens[tokens.length - 1].type === 'RPAREN')) {
                    tokens.push({ type: 'OPERATOR', value: '*' });
                }
                tokens.push({ type: 'LPAREN', value: '(' });
                i++;
                continue;
            }

            if (char === ')') {
                tokens.push({ type: 'RPAREN', value: ')' });
                i++;
                continue;
            }

            if (char === ',') {
                tokens.push({ type: 'COMMA', value: ',' });
                i++;
                continue;
            }

            throw new Error(`Unexpected character: ${char}`);
        }

        return tokens;
    }

    /**
     * Converts an array of tokens from Infix to Reverse Polish Notation (RPN).
     * Standard Shunting-Yard algorithm.
     * @param {Array<{type: string, value: string|number}>} tokens 
     * @returns {Array<{type: string, value: string|number}>}
     */
    static toRPN(tokens) {
        const output = [];
        const operatorStack = [];

        for (const token of tokens) {
            if (token.type === 'NUMBER' || token.type === 'VARIABLE') {
                output.push(token);
            } else if (token.type === 'FUNCTION') {
                operatorStack.push(token);
            } else if (token.type === 'COMMA') {
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type !== 'LPAREN') {
                    output.push(operatorStack.pop());
                }
            } else if (token.type === 'OPERATOR') {
                const o1 = token.value;
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === 'OPERATOR') {
                    const o2 = operatorStack[operatorStack.length - 1].value;
                    const prec1 = PRECEDENCE[o1];
                    const prec2 = PRECEDENCE[o2];
                    const isRightAssoc = RIGHT_ASSOCIATIVE[o1];

                    if ((!isRightAssoc && prec1 <= prec2) || (isRightAssoc && prec1 < prec2)) {
                        output.push(operatorStack.pop());
                    } else {
                        break;
                    }
                }
                operatorStack.push(token);
            } else if (token.type === 'LPAREN') {
                operatorStack.push(token);
            } else if (token.type === 'RPAREN') {
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type !== 'LPAREN') {
                    output.push(operatorStack.pop());
                }
                if (operatorStack.length === 0) throw new Error("Mismatched parentheses");
                operatorStack.pop(); // Pop LPAREN

                if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === 'FUNCTION') {
                    output.push(operatorStack.pop());
                }
            }
        }

        while (operatorStack.length > 0) {
            const op = operatorStack.pop();
            if (op.type === 'LPAREN' || op.type === 'RPAREN') throw new Error("Mismatched parentheses");
            output.push(op);
        }

        return output;
    }

    /**
     * Evaluates an RPN array using pooled memory for maximum performance.
     * @param {Array<{type: string, value: string|number}>} rpn 
     * @param {number} tValue 
     * @returns {number}
     */
    static evaluateRPN(rpn, tValue) {
        // Use StackPool to avoid array allocation on every eval!
        const stack = StackPool.acquireArray();

        try {
            for (let i = 0; i < rpn.length; i++) {
                const token = rpn[i];

                if (token.type === 'NUMBER') {
                    stack.push(token.value);
                } else if (token.type === 'VARIABLE') {
                    stack.push(tValue);
                } else if (token.type === 'OPERATOR') {
                    const b = stack.pop();
                    const a = stack.pop();
                    switch (token.value) {
                        case '+': stack.push(a + b); break;
                        case '-': stack.push(a - b); break;
                        case '*': stack.push(a * b); break;
                        case '/': stack.push(a / b); break;
                        case '^': stack.push(Math.pow(a, b)); break;
                    }
                } else if (token.type === 'FUNCTION') {
                    // Handles 1 or 2 argument functions
                    if (token.value === 'pow' || token.value === 'atan2' || token.value === 'min' || token.value === 'max') {
                        const b = stack.pop();
                        const a = stack.pop();
                        stack.push(Math[token.value](a, b));
                    } else {
                        const a = stack.pop();
                        stack.push(Math[token.value](a));
                    }
                }
            }

            const result = stack.pop();
            StackPool.releaseArray(stack); // Clean and return to pool
            // Explicitly check for valid number (result || 0 would swallow valid 0 results)
            if (result === undefined || result === null || !isFinite(result)) {
                return 0;
            }
            return result;
            
        } catch (e) {
            StackPool.releaseArray(stack); // Always clean up
            return 0; // Failsafe
        }
    }
}
