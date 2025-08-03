export interface FileItem {
  path: string;
  name: string;
  thumbnail?: string;
}

export interface PageThumbnail {
  id: string;
  src: string;
  fileIndex: number;
  pageIndex: number;
  fileName: string;
}
