export interface Category {
  id: number;
  name: string;
  active: boolean;
}

export interface CategoryRequest {
  name: string;
  active: boolean;
}
