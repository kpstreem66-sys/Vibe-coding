/**
 * Safe, expressive Python-like AST Interpreter for PySpell
 * Supports variables, list multiplication, loops, functions, conditionals,
 * string prints for character speech, and magical spell generation!
 */

import { ExecutionResult, SpellElement, SpellInstance } from '../types';

export const SPELL_ELEMENTS: Record<string, {
  element: SpellElement;
  damage: number;
  radius: number;
  speed: number;
  color: string;
  glowColor: string;
  label: string;
}> = {
  BOOM: {
    element: 'BOOM',
    damage: 35,
    radius: 45,
    speed: 7.5,
    color: '#f97316',
    glowColor: '#ef4444',
    label: 'BOOM',
  },
  FIRE: {
    element: 'FIRE',
    damage: 28,
    radius: 26,
    speed: 9.0,
    color: '#ef4444',
    glowColor: '#fbbf24',
    label: 'FIRE',
  },
  THUNDER: {
    element: 'THUNDER',
    damage: 42,
    radius: 20,
    speed: 14.0,
    color: '#eab308',
    glowColor: '#fef08a',
    label: 'THUNDER',
  },
  LIGHTNING: {
    element: 'LIGHTNING',
    damage: 45,
    radius: 22,
    speed: 15.0,
    color: '#eab308',
    glowColor: '#fef08a',
    label: 'LIGHTNING',
  },
  FROST: {
    element: 'FROST',
    damage: 22,
    radius: 28,
    speed: 6.5,
    color: '#06b6d4',
    glowColor: '#67e8f9',
    label: 'FROST',
  },
  ICE: {
    element: 'ICE',
    damage: 24,
    radius: 30,
    speed: 6.0,
    color: '#38bdf8',
    glowColor: '#bae6fd',
    label: 'ICE',
  },
  HEAL: {
    element: 'HEAL',
    damage: 0,
    radius: 35,
    speed: 0,
    color: '#22c55e',
    glowColor: '#86efac',
    label: 'HEAL',
  },
  SHIELD: {
    element: 'SHIELD',
    damage: 0,
    radius: 40,
    speed: 0,
    color: '#3b82f6',
    glowColor: '#93c5fd',
    label: 'SHIELD',
  },
  LASER: {
    element: 'LASER',
    damage: 55,
    radius: 16,
    speed: 18.0,
    color: '#ec4899',
    glowColor: '#f472b6',
    label: 'LASER',
  },
  METEOR: {
    element: 'METEOR',
    damage: 80,
    radius: 60,
    speed: 5.5,
    color: '#dc2626',
    glowColor: '#f97316',
    label: 'METEOR',
  },
  POISON: {
    element: 'POISON',
    damage: 18,
    radius: 24,
    speed: 7.0,
    color: '#a855f7',
    glowColor: '#d8b4fe',
    label: 'POISON',
  },
  SUMMON: {
    element: 'SUMMON',
    damage: 15,
    radius: 20,
    speed: 6.0,
    color: '#10b981',
    glowColor: '#6ee7b7',
    label: 'SUMMON',
  },
  BLACK_HOLE: {
    element: 'BLACK_HOLE',
    damage: 90,
    radius: 70,
    speed: 4.0,
    color: '#6366f1',
    glowColor: '#818cf8',
    label: 'BLACK_HOLE',
  },
};

/** Spell Object Class inside the Python runtime */
export class MagicSpellValue {
  public element: SpellElement;
  public multiplier: number;
  public label: string;

  constructor(element: SpellElement, multiplier: number = 1, label?: string) {
    this.element = element;
    this.multiplier = multiplier;
    this.label = label || element;
  }

  public toString(): string {
    if (this.multiplier > 1) {
      return `Spell[${this.element} x${this.multiplier}]`;
    }
    return `Spell[${this.element}]`;
  }
}

export interface RuntimeContext {
  boss: {
    name: string;
    hp: number;
    max_hp: number;
    state: string;
    is_telegraphing: boolean;
  };
  player: {
    hp: number;
    max_hp: number;
    mana: number;
    shield: number;
  };
}

export class PythonInterpreter {
  private stdout: string[] = [];
  private speeches: string[] = [];
  private spells: SpellInstance[] = [];
  private heals: number = 0;
  private shields: number = 0;
  private variables: Record<string, any> = {};
  private functions: Record<string, (...args: any[]) => any> = {};
  private loopStepsCount = 0;
  private MAX_LOOP_STEPS = 500;

  constructor() {
    this.resetEnvironment();
  }

  public resetEnvironment() {
    this.stdout = [];
    this.speeches = [];
    this.spells = [];
    this.heals = 0;
    this.shields = 0;
    this.variables = {};
    this.functions = {};
    this.loopStepsCount = 0;

    // Inject base spells as constants
    Object.keys(SPELL_ELEMENTS).forEach(elem => {
      this.variables[elem] = new MagicSpellValue(elem as SpellElement, 1, elem);
    });

    // Built-in Python functions
    this.variables['range'] = (...args: number[]) => {
      if (args.length === 1) {
        return Array.from({ length: Math.max(0, Math.floor(args[0])) }, (_, i) => i);
      }
      if (args.length === 2) {
        const start = Math.floor(args[0]);
        const stop = Math.floor(args[1]);
        const list: number[] = [];
        for (let i = start; i < stop; i++) list.push(i);
        return list;
      }
      if (args.length === 3) {
        const start = Math.floor(args[0]);
        const stop = Math.floor(args[1]);
        const step = Math.floor(args[2]);
        const list: number[] = [];
        if (step > 0) {
          for (let i = start; i < stop; i += step) list.push(i);
        } else if (step < 0) {
          for (let i = start; i > stop; i += step) list.push(i);
        }
        return list;
      }
      return [];
    };

    this.variables['len'] = (val: any) => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'string' || Array.isArray(val)) return val.length;
      if (typeof val === 'object') return Object.keys(val).length;
      return 0;
    };

    this.variables['sum'] = (arr: any) => {
      if (!Array.isArray(arr)) return 0;
      return arr.reduce((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0);
    };

    this.variables['max'] = (...args: any[]) => {
      const flat = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
      return Math.max(...flat);
    };

    this.variables['min'] = (...args: any[]) => {
      const flat = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
      return Math.min(...flat);
    };

    this.variables['abs'] = (n: number) => Math.abs(n);
    this.variables['str'] = (v: any) => String(v);
    this.variables['int'] = (v: any) => parseInt(v, 10) || 0;
    this.variables['float'] = (v: any) => parseFloat(v) || 0;
    this.variables['True'] = true;
    this.variables['False'] = false;
    this.variables['None'] = null;

    // Explicit cast / shout helpers if user prefers them
    this.variables['cast'] = (...items: any[]) => {
      this.handlePrintOrCast(items, true);
    };

    this.variables['shout'] = (...items: any[]) => {
      this.handlePrintOrCast(items, false, true);
    };

    this.variables['heal'] = (amount: number = 30) => {
      this.heals += amount;
      this.stdout.push(`[HEAL]: Chanted divine restoration +${amount} HP!`);
    };

    this.variables['shield'] = (amount: number = 50) => {
      this.shields += amount;
      this.stdout.push(`[SHIELD]: Chanted protective barrier +${amount} Shield!`);
    };
  }

  /**
   * Main Execute method that accepts raw Python code and a context object
   */
  public execute(code: string, context?: RuntimeContext): ExecutionResult {
    this.resetEnvironment();

    if (context) {
      this.variables['boss'] = { ...context.boss };
      this.variables['player'] = { ...context.player };
    }

    try {
      this.parseAndRunScript(code);

      return {
        success: true,
        stdout: this.stdout,
        speech: this.speeches.length > 0 ? this.speeches.join(' ') : undefined,
        spells: this.spells,
        heals: this.heals,
        shields: this.shields,
        variables: this.variables,
      };
    } catch (err: any) {
      const errorDetail = this.formatPythonError(err, code);
      return {
        success: false,
        stdout: this.stdout,
        speech: undefined,
        spells: [],
        heals: 0,
        shields: 0,
        error: errorDetail,
        variables: this.variables,
      };
    }
  }

  private formatPythonError(err: any, rawCode: string): { type: string; message: string; line?: number; tip?: string } {
    let type = 'SyntaxError';
    let message = err.message || 'Invalid Python syntax';
    let line: number | undefined = err.line;
    let tip = 'Check for matching parentheses, brackets, or variable spelling.';

    if (message.includes('is not defined') || message.includes('NameError')) {
      type = 'NameError';
      const match = message.match(/name '(.+?)' is not defined/);
      const varName = match ? match[1] : '';
      if (['boom', 'fire', 'thunder', 'frost', 'heal', 'shield', 'meteor'].includes(varName.toLowerCase())) {
        tip = `Magic spells are capitalized in Python! Try '${varName.toUpperCase()}' instead of '${varName}'.`;
      } else {
        tip = `Did you forget to assign variable '${varName} = ...' first?`;
      }
    } else if (message.includes('ZeroDivisionError') || message.includes('division by zero')) {
      type = 'ZeroDivisionError';
      tip = 'Cannot divide a spell or number by zero!';
    } else if (message.includes('IndentationError') || message.includes('indent')) {
      type = 'IndentationError';
      tip = 'Check that your loop and if-statement blocks are consistently indented with 2 or 4 spaces.';
    } else if (message.includes('Maximum loop limit exceeded')) {
      type = 'RecursionError';
      tip = 'Your loop executed more than 500 times! Infinite loop avoided.';
    }

    return { type, message, line, tip };
  }

  private parseAndRunScript(code: string) {
    const rawLines = code.split('\n');
    let lineIdx = 0;

    while (lineIdx < rawLines.length) {
      const line = rawLines[lineIdx];
      const trimmed = line.trim();

      // Skip empty or comment lines
      if (!trimmed || trimmed.startsWith('#')) {
        lineIdx++;
        continue;
      }

      // 1. Function definition: def func_name(args):
      if (trimmed.startsWith('def ')) {
        const defMatch = trimmed.match(/^def\s+([a-zA-Z_]\w*)\s*\((.*?)\)\s*:/);
        if (!defMatch) {
          throw { message: `SyntaxError: invalid syntax in function definition: '${trimmed}'`, line: lineIdx + 1 };
        }
        const funcName = defMatch[1];
        const argNames = defMatch[2].split(',').map(s => s.trim()).filter(Boolean);

        // Gather block body
        const baseIndent = this.getIndent(line);
        lineIdx++;
        const bodyLines: string[] = [];
        while (lineIdx < rawLines.length) {
          const nextLine = rawLines[lineIdx];
          const nextTrimmed = nextLine.trim();
          if (!nextTrimmed || nextTrimmed.startsWith('#')) {
            bodyLines.push(nextLine);
            lineIdx++;
            continue;
          }
          if (this.getIndent(nextLine) <= baseIndent) {
            break;
          }
          bodyLines.push(nextLine);
          lineIdx++;
        }

        // Register function
        this.functions[funcName] = (...passedArgs: any[]) => {
          const localInterpreter = new PythonInterpreter();
          localInterpreter.variables = { ...this.variables };
          localInterpreter.functions = { ...this.functions };
          argNames.forEach((arg, idx) => {
            localInterpreter.variables[arg] = passedArgs[idx];
          });
          const res = localInterpreter.execute(bodyLines.join('\n'));
          if (!res.success && res.error) {
            throw res.error;
          }
          // Merge stdout & spells
          this.stdout.push(...res.stdout);
          this.spells.push(...res.spells);
          this.heals += res.heals;
          this.shields += res.shields;
          if (res.speech) this.speeches.push(res.speech);
          return localInterpreter.variables['__return_val__'] ?? null;
        };

        this.variables[funcName] = this.functions[funcName];
        continue;
      }

      // 2. For loop: for x in iterable:
      if (trimmed.startsWith('for ')) {
        const forMatch = trimmed.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+(.+?)\s*:/);
        if (!forMatch) {
          throw { message: `SyntaxError: invalid syntax in for loop: '${trimmed}'`, line: lineIdx + 1 };
        }
        const varName = forMatch[1];
        const iterExpr = forMatch[2];
        const iterable = this.evaluateExpression(iterExpr, lineIdx + 1);

        const baseIndent = this.getIndent(line);
        lineIdx++;
        const bodyLines: string[] = [];
        while (lineIdx < rawLines.length) {
          const nextLine = rawLines[lineIdx];
          const nextTrimmed = nextLine.trim();
          if (!nextTrimmed || nextTrimmed.startsWith('#')) {
            bodyLines.push(nextLine);
            lineIdx++;
            continue;
          }
          if (this.getIndent(nextLine) <= baseIndent) {
            break;
          }
          bodyLines.push(nextLine);
          lineIdx++;
        }

        const list = Array.isArray(iterable) ? iterable : [];
        for (const item of list) {
          this.loopStepsCount++;
          if (this.loopStepsCount > this.MAX_LOOP_STEPS) {
            throw { message: 'RecursionError: Maximum loop limit exceeded (500 iterations)', line: lineIdx };
          }
          this.variables[varName] = item;
          this.parseAndRunBlock(bodyLines);
        }
        continue;
      }

      // 3. While loop: while condition:
      if (trimmed.startsWith('while ')) {
        const whileMatch = trimmed.match(/^while\s+(.+?)\s*:/);
        if (!whileMatch) {
          throw { message: `SyntaxError: invalid syntax in while loop: '${trimmed}'`, line: lineIdx + 1 };
        }
        const conditionExpr = whileMatch[1];

        const baseIndent = this.getIndent(line);
        lineIdx++;
        const bodyLines: string[] = [];
        while (lineIdx < rawLines.length) {
          const nextLine = rawLines[lineIdx];
          const nextTrimmed = nextLine.trim();
          if (!nextTrimmed || nextTrimmed.startsWith('#')) {
            bodyLines.push(nextLine);
            lineIdx++;
            continue;
          }
          if (this.getIndent(nextLine) <= baseIndent) {
            break;
          }
          bodyLines.push(nextLine);
          lineIdx++;
        }

        while (Boolean(this.evaluateExpression(conditionExpr, lineIdx))) {
          this.loopStepsCount++;
          if (this.loopStepsCount > this.MAX_LOOP_STEPS) {
            throw { message: 'RecursionError: Maximum loop limit exceeded in while loop', line: lineIdx };
          }
          this.parseAndRunBlock(bodyLines);
        }
        continue;
      }

      // 4. If / Else statements
      if (trimmed.startsWith('if ')) {
        const ifMatch = trimmed.match(/^if\s+(.+?)\s*:/);
        if (!ifMatch) {
          throw { message: `SyntaxError: invalid syntax in if statement: '${trimmed}'`, line: lineIdx + 1 };
        }
        const conditionExpr = ifMatch[1];
        const isTrue = Boolean(this.evaluateExpression(conditionExpr, lineIdx + 1));

        const baseIndent = this.getIndent(line);
        lineIdx++;
        const ifBody: string[] = [];
        while (lineIdx < rawLines.length) {
          const nextLine = rawLines[lineIdx];
          const nextTrimmed = nextLine.trim();
          if (!nextTrimmed || nextTrimmed.startsWith('#')) {
            ifBody.push(nextLine);
            lineIdx++;
            continue;
          }
          if (this.getIndent(nextLine) <= baseIndent) {
            break;
          }
          ifBody.push(nextLine);
          lineIdx++;
        }

        let elseBody: string[] = [];
        if (lineIdx < rawLines.length && rawLines[lineIdx].trim().startsWith('else:')) {
          lineIdx++;
          while (lineIdx < rawLines.length) {
            const nextLine = rawLines[lineIdx];
            const nextTrimmed = nextLine.trim();
            if (!nextTrimmed || nextTrimmed.startsWith('#')) {
              elseBody.push(nextLine);
              lineIdx++;
              continue;
            }
            if (this.getIndent(nextLine) <= baseIndent) {
              break;
            }
            elseBody.push(nextLine);
            lineIdx++;
          }
        }

        if (isTrue) {
          this.parseAndRunBlock(ifBody);
        } else if (elseBody.length > 0) {
          this.parseAndRunBlock(elseBody);
        }
        continue;
      }

      // 5. Return statement
      if (trimmed.startsWith('return ')) {
        const retExpr = trimmed.substring(7).trim();
        this.variables['__return_val__'] = this.evaluateExpression(retExpr, lineIdx + 1);
        lineIdx++;
        return;
      }

      // 6. Regular statement: assignment or function/print call
      this.executeStatement(trimmed, lineIdx + 1);
      lineIdx++;
    }
  }

  private parseAndRunBlock(lines: string[]) {
    // Remove relative indentation
    const firstNonEmpty = lines.find(l => l.trim().length > 0);
    if (!firstNonEmpty) return;
    const baseIndent = this.getIndent(firstNonEmpty);
    const unindented = lines.map(l => (l.startsWith(' '.repeat(baseIndent)) ? l.slice(baseIndent) : l));
    this.parseAndRunScript(unindented.join('\n'));
  }

  private getIndent(line: string): number {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }

  private executeStatement(stmt: string, lineNum: number) {
    const trimmed = stmt.trim();
    if (!trimmed) return;

    // Check for semicolon delimited multi-statements: bomb = [BOOM] * 6; print(bomb)
    if (trimmed.includes(';')) {
      const subStmts = trimmed.split(';');
      for (const sub of subStmts) {
        if (sub.trim()) {
          this.executeStatement(sub.trim(), lineNum);
        }
      }
      return;
    }

    // Check for glued statement: e.g. "bomb = [BOOM] * 6 print(bomb)" or "print('hi') print(b)"
    const gluedMatch = trimmed.match(/^(.+?=\s*[^;]+?)\s+(print\(.*?\))$/s);
    if (gluedMatch) {
      this.executeStatement(gluedMatch[1].trim(), lineNum);
      this.executeStatement(gluedMatch[2].trim(), lineNum);
      return;
    }

    const gluedPrintMatch = trimmed.match(/^(print\(.*?\))\s+(print\(.*?\))$/s);
    if (gluedPrintMatch) {
      this.executeStatement(gluedPrintMatch[1].trim(), lineNum);
      this.executeStatement(gluedPrintMatch[2].trim(), lineNum);
      return;
    }

    // Method invocation on lists: e.g. bomb.append(BOOM) or bomb.extend([FIRE] * 2)
    const methodMatch = trimmed.match(/^([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)\s*\((.*)\)$/);
    if (methodMatch) {
      const targetVar = methodMatch[1];
      const methodName = methodMatch[2];
      const argsRaw = methodMatch[3];
      const parsedArgs = argsRaw.trim() ? this.splitArgs(argsRaw).map(a => this.evaluateExpression(a, lineNum)) : [];
      const targetVal = this.variables[targetVar];

      if (Array.isArray(targetVal)) {
        if (methodName === 'append') {
          targetVal.push(parsedArgs[0]);
          return;
        } else if (methodName === 'extend') {
          if (Array.isArray(parsedArgs[0])) {
            targetVal.push(...parsedArgs[0]);
          } else {
            targetVal.push(parsedArgs[0]);
          }
          return;
        } else if (methodName === 'pop') {
          return targetVal.pop();
        } else if (methodName === 'reverse') {
          targetVal.reverse();
          return;
        } else if (methodName === 'clear') {
          targetVal.length = 0;
          return;
        }
      }
    }

    // Assignment: x = expr or x += expr
    if (trimmed.includes('=') && !trimmed.startsWith('print(') && !trimmed.startsWith('return ')) {
      let assignOp = '=';
      let parts: string[] = [];

      if (trimmed.includes('+=') && !trimmed.includes('==')) {
        assignOp = '+=';
        parts = trimmed.split('+=');
      } else if (trimmed.includes('-=') && !trimmed.includes('==')) {
        assignOp = '-=';
        parts = trimmed.split('-=');
      } else if (trimmed.includes('*=') && !trimmed.includes('==')) {
        assignOp = '*=';
        parts = trimmed.split('*=');
      } else if (!trimmed.includes('==') && !trimmed.includes('<=') && !trimmed.includes('>=') && !trimmed.includes('!=')) {
        assignOp = '=';
        parts = trimmed.split('=');
      }

      if (parts.length >= 2) {
        const varName = parts[0].trim();
        const expr = parts.slice(1).join('=').trim();
        const evaluated = this.evaluateExpression(expr, lineNum);

        if (assignOp === '=') {
          this.variables[varName] = evaluated;
        } else if (assignOp === '+=') {
          this.variables[varName] = this.performAdd(this.variables[varName], evaluated);
        } else if (assignOp === '-=') {
          this.variables[varName] = (this.variables[varName] || 0) - evaluated;
        } else if (assignOp === '*=') {
          this.variables[varName] = this.performMultiply(this.variables[varName], evaluated);
        }
        return;
      }
    }

    // print(...) call
    if (trimmed.startsWith('print(') && trimmed.endsWith(')')) {
      const inner = trimmed.slice(6, -1);
      const args = this.splitArgs(inner).map(arg => this.evaluateExpression(arg, lineNum));
      this.handlePrintOrCast(args, false);
      return;
    }

    // Direct expression / function invocation
    this.evaluateExpression(trimmed, lineNum);
  }

  private splitArgs(argsStr: string): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];

      if (inQuote) {
        current += char;
        if (char === quoteChar && argsStr[i - 1] !== '\\') {
          inQuote = false;
        }
        continue;
      }

      if (char === '"' || char === "'") {
        inQuote = true;
        quoteChar = char;
        current += char;
        continue;
      }

      if (char === '(' || char === '[' || char === '{') {
        depth++;
        current += char;
      } else if (char === ')' || char === ']' || char === '}') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      result.push(current.trim());
    }

    return result;
  }

  /**
   * Handles print(...) or cast(...)
   * If strings are printed, triggers speech dialogue.
   * If spells/lists of spells are printed, triggers projectile spells!
   */
  private handlePrintOrCast(args: any[], forceCast: boolean = false, forceShout: boolean = false) {
    const stringParts: string[] = [];
    const spellsToCast: SpellInstance[] = [];

    args.forEach(arg => {
      // 1. Array of spells (e.g. [BOOM] * 5 or [FIRE, BOOM])
      if (Array.isArray(arg)) {
        let isSpellList = false;
        arg.forEach(item => {
          if (item instanceof MagicSpellValue) {
            isSpellList = true;
            this.pushSpell(item, spellsToCast);
          } else if (typeof item === 'string' && SPELL_ELEMENTS[item]) {
            isSpellList = true;
            this.pushSpell(new MagicSpellValue(item as SpellElement, 1), spellsToCast);
          } else {
            stringParts.push(String(item));
          }
        });
        if (isSpellList) {
          stringParts.push(`[${arg.map(a => (a instanceof MagicSpellValue ? a.element : String(a))).join(', ')}]`);
        }
      } 
      // 2. Single MagicSpellValue
      else if (arg instanceof MagicSpellValue) {
        this.pushSpell(arg, spellsToCast);
        stringParts.push(arg.toString());
      }
      // 3. Plain string
      else if (typeof arg === 'string') {
        // If string matches spell name exactly and forceCast is active
        if (forceCast && SPELL_ELEMENTS[arg.toUpperCase()]) {
          this.pushSpell(new MagicSpellValue(arg.toUpperCase() as SpellElement, 1), spellsToCast);
        } else {
          stringParts.push(arg);
          if (!forceCast) {
            this.speeches.push(arg);
          }
        }
      } 
      // 4. Numbers / Booleans / Objects
      else {
        stringParts.push(String(arg));
      }
    });

    const printedOutput = stringParts.join(' ');
    this.stdout.push(printedOutput);

    // If spells were generated, queue them for combat canvas!
    if (spellsToCast.length > 0) {
      this.spells.push(...spellsToCast);
    }
  }

  private pushSpell(spellVal: MagicSpellValue, list: SpellInstance[]) {
    const config = SPELL_ELEMENTS[spellVal.element] || SPELL_ELEMENTS.BOOM;

    if (spellVal.element === 'HEAL') {
      this.heals += 30 * spellVal.multiplier;
      return;
    }
    if (spellVal.element === 'SHIELD') {
      this.shields += 40 * spellVal.multiplier;
      return;
    }

    const count = Math.max(1, Math.min(25, spellVal.multiplier));
    for (let i = 0; i < count; i++) {
      list.push({
        id: `spell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        element: spellVal.element,
        multiplier: 1,
        rawName: spellVal.label,
        damage: config.damage,
        speed: config.speed,
        radius: config.radius,
        color: config.color,
        glowColor: config.glowColor,
        label: spellVal.label,
      });
    }
  }

  private performAdd(a: any, b: any): any {
    if (Array.isArray(a) && Array.isArray(b)) {
      return [...a, ...b];
    }
    if (typeof a === 'string' || typeof b === 'string') {
      return String(a) + String(b);
    }
    if (a instanceof MagicSpellValue && b instanceof MagicSpellValue) {
      return [a, b];
    }
    if (Array.isArray(a) && b instanceof MagicSpellValue) {
      return [...a, b];
    }
    return (a || 0) + (b || 0);
  }

  private performMultiply(a: any, b: any): any {
    // b * 5 where b is [BOOM] -> array of 5 BOOMs
    if (Array.isArray(a) && typeof b === 'number') {
      const times = Math.max(0, Math.min(50, Math.floor(b)));
      const result: any[] = [];
      for (let i = 0; i < times; i++) {
        result.push(...a.map(item => (item instanceof MagicSpellValue ? new MagicSpellValue(item.element, item.multiplier, item.label) : item)));
      }
      return result;
    }
    // 5 * [BOOM]
    if (typeof a === 'number' && Array.isArray(b)) {
      return this.performMultiply(b, a);
    }
    // MagicSpellValue * 5: BOOM * 5 -> [BOOM, BOOM, BOOM, BOOM, BOOM]
    if (a instanceof MagicSpellValue && typeof b === 'number') {
      const times = Math.max(0, Math.min(50, Math.floor(b)));
      const result: MagicSpellValue[] = [];
      for (let i = 0; i < times; i++) {
        result.push(new MagicSpellValue(a.element, 1, a.label));
      }
      return result;
    }
    if (typeof a === 'number' && b instanceof MagicSpellValue) {
      return this.performMultiply(b, a);
    }
    // String multiplication: "pew " * 3
    if (typeof a === 'string' && typeof b === 'number') {
      return a.repeat(Math.max(0, Math.min(50, Math.floor(b))));
    }
    return (a || 0) * (b || 0);
  }

  /**
   * Evaluates expressions such as:
   * `b * 5`, `[BOOM] * 3`, `[FIRE, FROST]`, `50 + 20`, `len(b)`, `boss.hp < 100`, `[BOOM for _ in range(5)]`
   */
  public evaluateExpression(expr: string, lineNum: number = 1): any {
    const trimmed = expr.trim();
    if (!trimmed) return null;

    // 1. Literal numbers
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }

    // 2. Literal strings (single or double quotes)
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }

    // 3. List Comprehension: [expr for var in iterable]
    const listCompMatch = trimmed.match(/^\[\s*(.+?)\s+for\s+([a-zA-Z_]\w*)\s+in\s+(.+?)\s*\]$/);
    if (listCompMatch) {
      const itemExpr = listCompMatch[1];
      const varName = listCompMatch[2];
      const iterableExpr = listCompMatch[3];
      const iterList = this.evaluateExpression(iterableExpr, lineNum);
      const res: any[] = [];
      if (Array.isArray(iterList)) {
        for (const it of iterList) {
          const oldVar = this.variables[varName];
          this.variables[varName] = it;
          res.push(this.evaluateExpression(itemExpr, lineNum));
          this.variables[varName] = oldVar;
        }
      }
      return res;
    }

    // 4. List Literal: [item1, item2, ...]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const inner = trimmed.slice(1, -1);
      if (!inner.trim()) return [];
      const parts = this.splitArgs(inner);
      return parts.map(p => this.evaluateExpression(p, lineNum));
    }

    // 5. Comparison operators: ==, !=, <=, >=, <, >
    for (const op of ['==', '!=', '<=', '>=', '<', '>']) {
      if (trimmed.includes(op)) {
        const parts = trimmed.split(op);
        if (parts.length === 2) {
          const left = this.evaluateExpression(parts[0], lineNum);
          const right = this.evaluateExpression(parts[1], lineNum);
          switch (op) {
            case '==': return left === right;
            case '!=': return left !== right;
            case '<=': return left <= right;
            case '>=': return left >= right;
            case '<': return left < right;
            case '>': return left > right;
          }
        }
      }
    }

    // 6. Binary operations (+, -, *, /, %, **)
    // Look for multiplication / division first or addition / subtraction
    // We split carefully outside brackets/parentheses
    const op = this.findTopLevelOperator(trimmed);
    if (op) {
      const left = this.evaluateExpression(op.left, lineNum);
      const right = this.evaluateExpression(op.right, lineNum);
      switch (op.operator) {
        case '+': return this.performAdd(left, right);
        case '-': return (left || 0) - (right || 0);
        case '*': return this.performMultiply(left, right);
        case '/':
          if (right === 0) throw { message: 'ZeroDivisionError: division by zero', line: lineNum };
          return (left || 0) / right;
        case '//':
          if (right === 0) throw { message: 'ZeroDivisionError: integer division by zero', line: lineNum };
          return Math.floor((left || 0) / right);
        case '%':
          if (right === 0) throw { message: 'ZeroDivisionError: modulo by zero', line: lineNum };
          return (left || 0) % right;
        case '**': return Math.pow(left || 0, right || 0);
      }
    }

    // 7. Function call: func(arg1, arg2)
    const callMatch = trimmed.match(/^([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)\s*\((.*)\)$/);
    if (callMatch) {
      const funcTarget = callMatch[1];
      const argsRaw = callMatch[2];
      const parsedArgs = argsRaw.trim() ? this.splitArgs(argsRaw).map(a => this.evaluateExpression(a, lineNum)) : [];

      const func = this.resolveIdentifier(funcTarget, lineNum);
      if (typeof func === 'function') {
        return func(...parsedArgs);
      } else {
        throw { message: `TypeError: '${funcTarget}' is not callable`, line: lineNum };
      }
    }

    // 8. Dot property access: boss.hp, player.mana
    if (trimmed.includes('.')) {
      return this.resolveIdentifier(trimmed, lineNum);
    }

    // 9. Identifier lookup (variables, magic constants)
    if (/^[a-zA-Z_]\w*$/.test(trimmed)) {
      if (Object.prototype.hasOwnProperty.call(this.variables, trimmed)) {
        return this.variables[trimmed];
      }
      throw { message: `NameError: name '${trimmed}' is not defined`, line: lineNum };
    }

    return trimmed;
  }

  private resolveIdentifier(ident: string, lineNum: number): any {
    const parts = ident.split('.');
    let curr: any = this.variables;
    for (const part of parts) {
      if (curr === undefined || curr === null) {
        throw { message: `AttributeError: '${parts.join('.')}' object has no attribute '${part}'`, line: lineNum };
      }
      curr = curr[part];
    }
    if (curr === undefined) {
      throw { message: `NameError: name '${ident}' is not defined`, line: lineNum };
    }
    return curr;
  }

  private findTopLevelOperator(expr: string): { left: string; right: string; operator: string } | null {
    const operators = ['+', '-', '*', '/', '//', '%', '**'];
    // Check operators in order of lowest precedence first: + and -, then *, /, %, then **
    const precedenceGroups = [
      ['+', '-'],
      ['*', '/', '//', '%'],
      ['**'],
    ];

    for (const group of precedenceGroups) {
      let depth = 0;
      let inQuote = false;
      let quoteChar = '';

      for (let i = expr.length - 1; i >= 0; i--) {
        const char = expr[i];

        if (inQuote) {
          if (char === quoteChar && expr[i - 1] !== '\\') inQuote = false;
          continue;
        }
        if (char === '"' || char === "'") {
          inQuote = true;
          quoteChar = char;
          continue;
        }
        if (char === ')' || char === ']' || char === '}') depth++;
        else if (char === '(' || char === '[' || char === '{') depth--;

        if (depth === 0) {
          for (const op of group) {
            const opLen = op.length;
            if (expr.substring(i - opLen + 1, i + 1) === op) {
              const left = expr.substring(0, i - opLen + 1).trim();
              const right = expr.substring(i + 1).trim();
              if (left && right) {
                return { left, right, operator: op };
              }
            }
          }
        }
      }
    }
    return null;
  }
}

export const pythonInterpreter = new PythonInterpreter();
