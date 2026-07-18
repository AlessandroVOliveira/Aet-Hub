export interface ApiErrorIssue {
  path: (string | number)[];
  message: string;
  code?: string;
}

export interface ApiErrorBody {
  message: string;
  issues?: ApiErrorIssue[];
}
