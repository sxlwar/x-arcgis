export type PredicateFn<T> = (data: T, value: any) => boolean;

/**
 * @function deepSearchFactory
 * @param predicateFn predicate value of the key in the node is equal to the search value;
 * @param value - the value to be searched
 * @param key - child node key
 */
export const deepSearchFactory = <T>(predicateFn: PredicateFn<T>, value: any, key: string) => {
  return function deepSearch(data: T[]): T {
    const headNode = data.slice(0, 1)[0];
    const restNodes = data.slice(1); //

    // 当前节点已经被判定为符合指定条件的值，直接返回
    if (predicateFn(headNode, value)) {
      return headNode;
    }

    // 当前节点上还有子节点，优先在子节点上进行搜索，
    if (headNode[key]) {
      const res = deepSearch(headNode[key]);

      if (res) {
        return res; // 搜索到符合条件的值，返回
      }
    }

    // 继续在剩下的节点中进行搜索
    if (restNodes.length) {
      const res = deepSearch(restNodes);

      if (res) {
        return res; // 搜索到符合条件的值，返回
      }
    }

    return null; // 遍历完成后没有找到返回null
  };
};

/**
 * @function deepSearchRecordFactory
 * @param predicateFn predicate value of the key in the node is equal to the search value;
 * @param value - the value to be searched
 * @param key - child node key
 */
export const deepSearchRecordFactory = <T>(predicateFn: PredicateFn<T>, value: any, key: string) => {
  return function search(data: T[], record = []): number[] {
    const headNode = data.slice(0, 1)[0];
    const restNodes = data.slice(1);

    record.push(-restNodes.length - 1); // 节点位置入栈

    if (predicateFn(headNode, value)) {
      return record;
    }

    if (headNode[key]) {
      const res = search(headNode[key], record);

      if (res) {
        return record;
      } else {
        record.pop(); // 节点出栈
      }
    }

    if (restNodes.length) {
      record.pop(); // 节点出栈

      const res = search(restNodes, record);

      if (res) {
        return record;
      }
    }

    return null;
  };
};

/**
 * @function searchCascadeNodes
 * @param data - source data
 * @param records - search records, use deepSearchRecordFactory to get the records
 * @param key - child node key
 */
export const searchCascadeNodes = <T>(data: T[], records: number[], key: string, result: T[] = []): T[] => {
  const position = records[0] + data.length;
  const node = data[position];

  if (node) {
    result.push(node);
  }

  data = node[key];
  records = records.slice(1);

  if (records.length) {
    searchCascadeNodes(data, records, key, result);
  }

  return result;
};

/**
 * @function getTargetByRecorder
 * @param data - source data;
 * @param paths - search value recorder
 * @param key - child node key
 */
const getTargetByRecorder = <T>(data: T[], paths: number[], key: string): T => {
  if (!paths) {
    return null;
  }

  const getNode = (d: T[], pos: number): T => d[d.length + pos]; // 通过正向索引取得节点
  const position = paths.shift();
  const node = getNode(data, position);

  if (!paths.length) {
    return node;
  } else {
    const subData = node[key];

    return getTargetByRecorder(subData, paths, key);
  }
};
