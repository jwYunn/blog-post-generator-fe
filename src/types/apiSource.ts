export interface ApiSource {
  id: string;
  name: string;
  url: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSourceFormValues {
  name: string;
  url: string;
  meta?: Record<string, unknown>;
}
