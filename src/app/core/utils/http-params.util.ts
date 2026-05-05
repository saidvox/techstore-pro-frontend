import { HttpParams } from '@angular/common/http';

type QueryValue = string | number | boolean | null | undefined;

export function toHttpParams<T extends object>(query: T): HttpParams {
  let params = new HttpParams();

  Object.entries(query).forEach(([key, value]: [string, unknown]) => {
    if (isQueryValue(value) && value !== undefined && value !== null && value !== '') {
      params = params.set(key, String(value));
    }
  });

  return params;
}

function isQueryValue(value: unknown): value is QueryValue {
  return value === undefined
    || value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean';
}
