export interface GenerateInsightActionState {
  error: string | null;
  message: string | null;
}

export const initialGenerateInsightActionState: GenerateInsightActionState = {
  error: null,
  message: null,
};
