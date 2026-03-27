from ast_nodes import IndicatorNode, NumberNode, BinaryOpNode, ComparisonNode, LogicalNode

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
