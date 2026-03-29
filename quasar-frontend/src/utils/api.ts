type PrimitiveParam = string | number | boolean;
type QueryParamValue =
  | PrimitiveParam
  | null
  | undefined
  | readonly PrimitiveParam[]
  | PrimitiveParam[];

export interface DataEnvelope<T> {
  data?: T | undefined;
}

export interface BuildRequestParamsOptions {
  trimStrings?: boolean;
  skipValues?: unknown[];
}

function isPrimitiveParam(value: unknown): value is PrimitiveParam {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

export function buildRequestParams(
  params: Record<string, QueryParamValue>,
  options: BuildRequestParamsOptions = {},
): Record<string, PrimitiveParam | PrimitiveParam[]> {
  const { trimStrings = true, skipValues = ['', null, undefined] } = options;
  const nextParams: Record<string, PrimitiveParam | PrimitiveParam[]> = {};

  Object.entries(params).forEach(([key, rawValue]) => {
    if (Array.isArray(rawValue)) {
      const nextArray = rawValue
        .filter((value) => isPrimitiveParam(value) && !skipValues.includes(value))
        .map((value) => (typeof value === 'string' && trimStrings ? value.trim() : value))
        .filter((value) => !skipValues.includes(value));

      if (nextArray.length > 0) {
        nextParams[key] = nextArray;
      }

      return;
    }

    if (!isPrimitiveParam(rawValue)) {
      return;
    }

    const nextValue = typeof rawValue === 'string' && trimStrings ? rawValue.trim() : rawValue;
    if (skipValues.includes(nextValue)) {
      return;
    }

    nextParams[key] = nextValue;
  });

  return nextParams;
}

export function normalizeArrayResponse<T>(data: T[] | DataEnvelope<T[]> | null | undefined): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}
