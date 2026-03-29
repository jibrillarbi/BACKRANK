from enum import Enum, auto
from backtester.ast_nodes import IndicatorNode, NumberNode, BinaryOpNode, ComparisonNode, LogicalNode

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
