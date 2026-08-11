export interface TransactionActionState {
  error: string | null;
  fieldErrors: Record<string, string[]>;
}

export const initialTransactionActionState: TransactionActionState = {
  error: null,
  fieldErrors: {},
};
