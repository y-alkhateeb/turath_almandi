/**
 * Tree structure utility functions
 * For handling hierarchical data (e.g., navigation menus)
 */

export interface TreeNode<T = any> {
  id: string | number;
  parentId?: string | number | null;
  children?: TreeNode<T>[];
  [key: string]: any;
}

/**
 * Flatten a tree structure into an array
 */
export function flattenTree<T extends TreeNode>(
  tree: T[],
  result: T[] = []
): T[] {
  tree.forEach((node) => {
    const { children, ...rest } = node;
    result.push(rest as T);
    if (children && children.length > 0) {
      flattenTree(children as T[], result);
    }
  });
  return result;
}

/**
 * Convert flat array to tree structure based on parentId
 */
export function arrayToTree<T extends TreeNode>(
  items: T[],
  parentId: string | number | null = null
): T[] {
  return items
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      ...item,
      children: arrayToTree(items, item.id),
    }));
}

/**
 * Find a node in tree by id
 */
export function findNodeById<T extends TreeNode>(
  tree: T[],
  id: string | number
): T | null {
  for (const node of tree) {
    if (node.id === id) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children as T[], id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Find a node in tree by predicate function
 */
export function findNode<T extends TreeNode>(
  tree: T[],
  predicate: (node: T) => boolean
): T | null {
  for (const node of tree) {
    if (predicate(node)) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findNode(node.children as T[], predicate);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Get all ancestors of a node
 */
export function getAncestors<T extends TreeNode>(
  tree: T[],
  id: string | number
): T[] {
  const ancestors: T[] = [];

  function findAncestors(nodes: T[], targetId: string | number): boolean {
    for (const node of nodes) {
      if (node.id === targetId) {
        return true;
      }
      if (node.children && node.children.length > 0) {
        if (findAncestors(node.children as T[], targetId)) {
          ancestors.unshift(node);
          return true;
        }
      }
    }
    return false;
  }

  findAncestors(tree, id);
  return ancestors;
}

/**
 * Get all descendants of a node (including the node itself)
 */
export function getDescendants<T extends TreeNode>(node: T): T[] {
  const descendants: T[] = [node];

  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      descendants.push(...getDescendants(child as T));
    });
  }

  return descendants;
}

/**
 * Map over tree nodes
 */
export function mapTree<T extends TreeNode, R extends TreeNode>(
  tree: T[],
  fn: (node: T) => R
): R[] {
  return tree.map((node) => {
    const mapped = fn(node);
    if (node.children && node.children.length > 0) {
      mapped.children = mapTree(node.children as T[], fn);
    }
    return mapped;
  });
}

/**
 * Filter tree nodes
 */
export function filterTree<T extends TreeNode>(
  tree: T[],
  predicate: (node: T) => boolean
): T[] {
  return tree.reduce((acc, node) => {
    if (predicate(node)) {
      const filtered = { ...node };
      if (node.children && node.children.length > 0) {
        filtered.children = filterTree(node.children as T[], predicate);
      }
      acc.push(filtered);
    } else if (node.children && node.children.length > 0) {
      const filteredChildren = filterTree(node.children as T[], predicate);
      if (filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }
    }
    return acc;
  }, [] as T[]);
}

/**
 * Sort tree nodes
 */
export function sortTree<T extends TreeNode>(
  tree: T[],
  compareFn: (a: T, b: T) => number
): T[] {
  const sorted = [...tree].sort(compareFn);
  return sorted.map((node) => {
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: sortTree(node.children as T[], compareFn),
      };
    }
    return node;
  });
}

/**
 * Get tree depth
 */
export function getTreeDepth<T extends TreeNode>(tree: T[]): number {
  if (tree.length === 0) return 0;

  let maxDepth = 1;
  tree.forEach((node) => {
    if (node.children && node.children.length > 0) {
      const childDepth = getTreeDepth(node.children as T[]) + 1;
      maxDepth = Math.max(maxDepth, childDepth);
    }
  });

  return maxDepth;
}

/**
 * Get node level (depth from root)
 */
export function getNodeLevel<T extends TreeNode>(
  tree: T[],
  id: string | number,
  level: number = 0
): number {
  for (const node of tree) {
    if (node.id === id) {
      return level;
    }
    if (node.children && node.children.length > 0) {
      const childLevel = getNodeLevel(node.children as T[], id, level + 1);
      if (childLevel !== -1) {
        return childLevel;
      }
    }
  }
  return -1;
}
