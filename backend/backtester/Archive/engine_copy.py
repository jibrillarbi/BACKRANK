import pandas as pd
from enum import Enum, auto

class Node:
    pass


class IndicatorNode(Node):
    def __init__(self, name, period=None):
        self.name = name
        self.period = period
        self.column_name = name if period is None else f"{name}_{period}"

    def __str__(self):
        if self.period is None:
            return self.name
        return f"{self.name}({self.period})"

    def __eq__(self, other):
        return (
            isinstance(other, IndicatorNode)
            and self.name == other.name
            and self.period == other.period
        )

    def __hash__(self):
        return hash((self.name, self.period))


class NumberNode(Node):
    def __init__(self, value):
        self.value = value

    def __str__(self):
        return str(self.value)


class BinaryOpNode(Node):
    #operation * + - 
    def __init__(self, left, operator, right):
        self.left = left     
        self.operator = operator
        self.right = right    

    def __str__(self):
        return f"({self.left} {self.operator} {self.right})"


class ComparisonNode(Node):
    """Grammar C := S x S"""
    def __init__(self, left, operator, right):
        self.left = left      
        self.operator = operator
        self.right = right   

    def __str__(self):
        return f"{self.left} {self.operator} {self.right}"


class LogicalNode(Node):
    """Grammar A/L := ... && ... / ... || ..."""
    def __init__(self, left, operator, right):
        self.left = left      # ComparisonNode or LogicalNode
        self.operator = operator   # && or ||
        self.right = right

    def __str__(self):
        return f"({self.left} {self.operator} {self.right})"


'''
NAME     - indicator or field name     SMA, RSI, Close, Volume
NUMBER   - integer or float literal    20, 95, 1.02
LPAREN   - (
RPAREN   - )
ARITH    - arithmetic operator         + - * /
COMP     - comparison operator         > < >= <= = != crossesAbove crossesBelow
AND      - &&
OR       - ||
EOF      - end of input
'''


class TT(Enum):
    NAME   = auto()
    NUMBER = auto()
    LPAREN = auto()
    RPAREN = auto()
    ARITH  = auto()
    COMP   = auto()
    AND    = auto()
    OR     = auto()
    EOF    = auto()

class Token:
    def __init__(self, type, value):
        self.type  = type
        self.value = value

    def __str__(self):
        return f"Token({self.type.name}, {self.value!r})"



def tokenize(text):
    tokens = []
    WORD_COMPS = {'crossesAbove', 'crossesBelow'}
    i = 0
    while i < len(text):
        if text[i].isspace():
            i += 1
            continue

        
        if text[i:i+2] == '&&':
            tokens.append(Token(TT.AND, '&&'))
            i += 2
            continue
        if text[i:i+2] == '||':
            tokens.append(Token(TT.OR, '||'))
            i += 2
            continue

        if text[i:i+2] in ('>=', '<=', '!='):
            tokens.append(Token(TT.COMP, text[i:i+2]))
            i += 2
            continue

        if text[i] in ('>', '<', '='):
            tokens.append(Token(TT.COMP, text[i]))
            i += 1
            continue

        if text[i] in ('+', '*', '/','-'):
            tokens.append(Token(TT.ARITH, text[i]))
            i += 1
            continue
        if text[i] == '(':
            tokens.append(Token(TT.LPAREN, '('))
            i += 1
            continue
        if text[i] == ')':
            tokens.append(Token(TT.RPAREN, ')'))
            i += 1
            continue

        if text[i].isalpha():
            j = i
            while j < len(text) and (text[j].isalnum() or text[j] == '_'):
                j += 1
            word = text[i:j]
            if word in WORD_COMPS:
                tokens.append(Token(TT.COMP, word))
            else:
                tokens.append(Token(TT.NAME, word))
            i = j
            continue
        if text[i].isdigit():
            j = i
            while j < len(text) and (text[j].isdigit() or text[j] == '.'):
                j += 1
            raw = text[i:j]
            tokens.append(Token(TT.NUMBER, float(raw) if '.' in raw else int(raw)))
            i = j
            continue

        raise SyntaxError(f"Unexpected character {text[i]!r} at position {i}")

    tokens.append(Token(TT.EOF, None))
    return tokens


'''

L := A  ( || A )*
A := C  ( && C )*
C := S  COMP  S                          
S := T  ( (+ | -)  T )*   
T := F  ( (* | /)  F )*
F := NUMBER | INDICATOR | ( S )  
INDICATOR := NAME | NAME( NUMBER )

'''


class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.pos    = 0
        self.indicators = set()

    def _add_indicator(self, node):
        if node not in self.indicators:
            self.indicators.add(node)

    def peek(self):
        return self.tokens[self.pos]

    def consume(self, expected_type=None):
        tok = self.tokens[self.pos]
        if expected_type is not None and tok.type != expected_type:
            raise SyntaxError(
                f"Expected {expected_type.name}, got {tok.type.name} ({tok.value!r})"
            )
        self.pos += 1
        return tok

    def parse_L(self):
        """L := A ( '||' A )*"""
        node = self.parse_A()
        while self.peek().type == TT.OR:
            self.consume(TT.OR)
            right = self.parse_A()
            node = LogicalNode(node, "||", right)
        return node

    def parse_A(self):
        """A := C ( '&&' C )*"""
        node = self.parse_C()
        while self.peek().type == TT.AND:
            self.consume(TT.AND)
            right = self.parse_C()
            node = LogicalNode(node, "&&", right)
        return node

    def parse_C(self):
        """C := S COMP S"""
        left = self.parse_S()
        op   = self.consume(TT.COMP).value
        right = self.parse_S()
        return ComparisonNode(left, op, right)

    def parse_S(self):
        """S := T ( ('+' | '-') T )*"""
        node = self.parse_T()
        while self.peek().type == TT.ARITH and self.peek().value in ('+', '-'):
            op = self.consume(TT.ARITH).value
            right = self.parse_T()
            node = BinaryOpNode(node, op, right)
        return node

    def parse_T(self):
        """T := F ( ('*' | '/') F )*"""
        node = self.parse_F()
        while self.peek().type == TT.ARITH and self.peek().value in ('*', '/'):
            op = self.consume(TT.ARITH).value
            right = self.parse_F()
            node = BinaryOpNode(node, op, right)
        return node

    def parse_F(self):
        """F := NUMBER | INDICATOR | '(' S ')'"""
        tok = self.peek()

        if tok.type == TT.LPAREN:
            self.consume(TT.LPAREN)
            node = self.parse_S()
            self.consume(TT.RPAREN)
            return node

        if tok.type == TT.NUMBER:
            self.consume()
            return NumberNode(tok.value)

        if tok.type == TT.NAME:
            return self.parse_indicator()

        raise SyntaxError(
            f"Expected a number, indicator, or '(' , got {tok.type.name} ({tok.value!r})"
        )

    def parse_indicator(self):
        """INDICATOR := NAME | NAME(INT)
            returns IndicatorNode object """
        name = self.consume(TT.NAME).value
        period = None
        if self.peek().type == TT.LPAREN:
            self.consume(TT.LPAREN)
            period = self.consume(TT.NUMBER).value
            if not isinstance(period, int):
                raise SyntaxError(f"Indicator period must be an integer, got {period!r}")
            self.consume(TT.RPAREN)
        node = IndicatorNode(name, period)
        self._add_indicator(node)
        return node


def parse_rule(rule_string):
    tokens = tokenize(rule_string)
    parser = Parser(tokens)
    node = parser.parse_L()

    if parser.peek().type != TT.EOF:
        tok = parser.peek()
        raise SyntaxError(f"Unexpected token after end of rule: {tok.type.name} ({tok.value!r})")

    return node, parser.indicators


'''
def collect_indicators(node, indicators=None):
    if indicators is None:
        indicators = set()

    if isinstance(node, IndicatorNode):
        indicators.add(node)

    elif isinstance(node, NumberNode):
        pass

    elif isinstance(node, BinaryOpNode):
        collect_indicators(node.left, indicators)
        collect_indicators(node.right, indicators)

    elif isinstance(node, ComparisonNode):
        collect_indicators(node.left, indicators)
        collect_indicators(node.right, indicators)

    elif isinstance(node, LogicalNode):
        collect_indicators(node.left, indicators)
        collect_indicators(node.right, indicators)

    else:
        raise ValueError(f"Unknown node type while collecting indicators: {type(node)}")

    return indicators

'''



def SMA(values, n):
    return pd.Series(values).rolling(n).mean()


def VMA(volume, n):
    return pd.Series(volume).rolling(n).mean()


def EMA(values, n):
    s = pd.Series(values, dtype=float).copy()
    s.iloc[:n-1] = pd.NA
    s.iloc[n-1] = s.iloc[:n].mean()

    a = 2 / (n + 1)
    for i in range(n, len(s)):
        s.iloc[i] = a * s.iloc[i] + (1 - a) * s.iloc[i - 1]

    return s


def RSI(values, n):
    delta = pd.Series(values).diff()

    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_g = gain.iloc[1:n+1].mean()
    avg_l = loss.iloc[1:n+1].mean()

    rsi = pd.Series(index=range(len(delta)), dtype=float)

    rs = float("inf") if avg_l == 0 else avg_g / avg_l
    rsi.iloc[n] = 100 - (100 / (1 + rs))

    for i in range(n + 1, len(delta)):
        avg_g = ((avg_g * (n - 1)) + gain.iloc[i]) / n
        avg_l = ((avg_l * (n - 1)) + loss.iloc[i]) / n

        if avg_l == 0:
            rsi.iloc[i] = 100
        else:
            rs = avg_g / avg_l
            rsi.iloc[i] = 100 - (100 / (1 + rs))

    rsi.iloc[:n] = pd.NA
    return rsi


def ATR(high, low, close, n):
    high = pd.Series(high)
    low = pd.Series(low)
    close = pd.Series(close)

    tr = pd.Series(index=range(len(close)), dtype=float)
    tr.iloc[0] = high.iloc[0] - low.iloc[0]

    for i in range(1, len(close)):
        tr.iloc[i] = max(
            high.iloc[i] - low.iloc[i],
            abs(high.iloc[i] - close.iloc[i - 1]),
            abs(low.iloc[i] - close.iloc[i - 1])
        )

    atr = pd.Series(index=range(len(tr)), dtype=float)
    atr.iloc[:n-1] = pd.NA
    atr.iloc[n-1] = tr.iloc[:n].mean()

    for i in range(n, len(atr)):
        atr.iloc[i] = ((atr.iloc[i - 1] * (n - 1)) + tr.iloc[i]) / n

    return atr


def compute_indicators(df, indicators):
    for ind in indicators:
        col = ind.column_name

        if col in df.columns:
            continue

        if ind.name == "Open":
            df[col] = df["Open"]
        elif ind.name == "High":
            df[col] = df["High"]
        elif ind.name == "Low":
            df[col] = df["Low"]
        elif ind.name == "Close":
            df[col] = df["Close"]
        elif ind.name == "Volume":
            df[col] = df["Volume"]
        elif ind.name == "SMA":
            df[col] = SMA(df["Close"], ind.period)
        elif ind.name == "EMA":
            df[col] = EMA(df["Close"], ind.period)
        elif ind.name == "RSI":
            df[col] = RSI(df["Close"], ind.period)
        elif ind.name == "VMA":
            df[col] = VMA(df["Volume"], ind.period)
        elif ind.name == "ATR":
            df[col] = ATR(df["High"], df["Low"], df["Close"], ind.period)
        else:
            raise ValueError(f"Unknown indicator name: {ind.name}")

    return df


def eval_scalar(df, node):
    if isinstance(node, IndicatorNode):
        return df[node.column_name]

    if isinstance(node, NumberNode):
        return node.value

    if isinstance(node, BinaryOpNode):
        left = eval_scalar(df, node.left)
        right = eval_scalar(df, node.right)

        if node.operator == "+":
            return left + right
        if node.operator == "-":
            return left - right
        if node.operator == "*":
            return left * right
        if node.operator == "/":
            return left / right

        raise ValueError(f"Unknown scalar operator: {node.operator}")

    raise ValueError(f"Unknown scalar node: {type(node)}")


def eval_comparison(df, node):
    left = eval_scalar(df, node.left)
    right = eval_scalar(df, node.right)
    op = node.operator

    if op == ">":
        return left > right
    if op == "<":
        return left < right
    if op == ">=":
        return left >= right
    if op == "<=":
        return left <= right
    if op == "=":
        return left == right
    if op == "!=":
        return left != right
    if op == "crossesAbove":
        return (left.shift(1) <= right.shift(1)) & (left > right)
    if op == "crossesBelow":
        return (left.shift(1) >= right.shift(1)) & (left < right)

    raise ValueError(f"Unknown comparison operator: {op}")


def eval_logic(df, node):
    if isinstance(node, ComparisonNode):
        return eval_comparison(df, node)

    if isinstance(node, LogicalNode):
        left = eval_logic(df, node.left)
        right = eval_logic(df, node.right)

        if node.operator == "&&":
            return left & right
        if node.operator == "||":
            return left | right

        raise ValueError(f"Unknown logical operator: {node.operator}")

    raise ValueError(f"Unknown logical node: {type(node)}")



data = {
    'Open':   [100.0, 98.0, 96.0, 94.0, 92.0, 91.5, 93.0, 96.0, 100.0, 102.0, 101.0, 100.0, 99.0, 98.0, 97.0],
    'High':   [101.0, 99.0, 97.0, 95.0, 93.0, 92.5, 95.0, 99.0, 102.0, 104.0, 102.0, 101.0, 100.0, 99.0, 98.0],
    'Low':    [99.0,  97.0, 95.0, 93.0, 91.0, 90.0, 92.0, 95.0,  99.0, 101.0, 100.0,  99.0,  98.0, 97.0, 96.0],
    'Close':  [99.0,  97.0, 95.0, 93.0, 91.0, 92.0, 94.5, 98.5, 101.0, 103.0, 100.0,  99.0,  98.0, 97.0, 96.0],
    'Volume': [10000, 10000, 10000, 10000, 10000, 12000, 15000, 25000, 20000, 18000, 15000, 12000, 10000, 10000, 10000]
}
df = pd.DataFrame(data)

entry_ast, entry_inds = parse_rule("SMA(3)+3 crossesAbove SMA(5) && RSI(2) < 95 && Volume > VMA(3)")
exit_ast, exit_inds   = parse_rule("Close < SMA(3)")

print("ENTRY AST:", entry_ast)
print("EXIT AST :", exit_ast)

all_inds = entry_inds | exit_inds
df = compute_indicators(df, all_inds) 
entry_signal = eval_logic(df, entry_ast) 
exit_signal = eval_logic(df, exit_ast) 
print("Entry signal:") 
print(entry_signal) 
print("Exit signal:") 
print(exit_signal)