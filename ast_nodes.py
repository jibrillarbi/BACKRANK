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
