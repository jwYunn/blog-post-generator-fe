export type ThumbnailPromptStatus = 'generating' | 'done' | 'failed';

export interface ThumbnailPromptMeta {
  aspect_ratio?: string;
  output_format?: string;
  output_quality?: number;
  num_outputs?: number;
}

export interface ThumbnailPrompt {
  id: string;
  name: string | null;
  prompt: string;
  model: string;
  meta: ThumbnailPromptMeta | null;
  status: ThumbnailPromptStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Thumbnail {
  id: string;
  url: string;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export interface ThumbnailPromptMapping {
  id: string;
  promptId: string;
  thumbnailId: string;
  rank: number | null;
  active: boolean;
  createdAt: string;
  thumbnail: Thumbnail;
}

export interface GenerateThumbnailRequest {
  prompt: string;
  name?: string;
  model?: string;
  aspect_ratio?: string;
  output_format?: string;
  num_outputs?: number;
  output_quality?: number;
}

export interface ThumbnailPromptListResponse {
  data: ThumbnailPrompt[];
  total: number;
  page: number;
  limit: number;
}
