type MarkdownNode = {
    content: string;
    children: Record<string, MarkdownNode>;
};

export function parseMarkdown(md: string): MarkdownNode {
    const lines = md.split('\n');
    const rootNode: MarkdownNode = { content: '', children: {} };

    const headingStack: { node: MarkdownNode; level: number }[] = [];

    let currentNode = rootNode;

    for (const line of lines) {
        const headingMatch = line.match(/^(#+)\s*(.+)/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const title = headingMatch[2];

            while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
                headingStack.pop();
            }

            const newNode: MarkdownNode = { content: '', children: {} };
            if (headingStack.length > 0) {
                headingStack[headingStack.length - 1].node.children[title] = newNode;
            } else {
                rootNode.children[title] = newNode;
            }

            headingStack.push({ node: newNode, level });
            currentNode = newNode;
        } else {
            currentNode.content += line + '\n';
        }
    }

    return rootNode;
}