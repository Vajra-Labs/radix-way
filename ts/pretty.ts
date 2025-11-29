const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

const methodColors: Record<string, string> = {
  GET: colors.green,
  POST: colors.blue,
  PUT: colors.yellow,
  DELETE: colors.magenta,
  PATCH: colors.cyan,
};

export function prettyPrint(node: any, prefix = '', method?: string): string {
  let result = '';

  if (node.isLeafNode && node.handlers) {
    const methods = Array.from(node.handlers.keys()) as string[];
    const coloredMethods = methods
      .map(m => `${methodColors[m] || colors.cyan}${m}${colors.reset}`)
      .join(colors.gray + ', ' + colors.reset);
    result += ` ${colors.gray}[${colors.reset}${coloredMethods}${colors.gray}]${colors.reset}\n`;
  } else {
    result += '\n';
  }

  const children: [string, any, string][] = [];

  if (node.staticChildren) {
    for (const child of node.staticChildren.values()) {
      children.push([child.prefix, child, colors.dim]);
    }
  }

  if (node.parametricChildren) {
    for (const child of node.parametricChildren) {
      const label = Array.from(child.nodePaths).join(colors.gray + '|' + colors.yellow);
      children.push([label, child, colors.yellow]);
    }
  }

  if (node.wildcardChild) {
    children.push(['*', node.wildcardChild, colors.magenta]);
  }

  children.forEach(([label, child, color], i) => {
    const isLast = i === children.length - 1;
    const branch = isLast ? '└─ ' : '├─ ';
    const childPrefix = isLast ? '   ' : '│  ';
    result += `${colors.gray}${prefix}${branch}${colors.reset}${color}${label}${colors.reset}${prettyPrint(child, prefix + childPrefix, method)}`;
  });

  return result;
}
