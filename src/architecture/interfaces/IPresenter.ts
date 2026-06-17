export interface IPresenter {
  startGame(): void;
  onCellClicked(x: number, y: number, symbol?: string, sourceX?: number, sourceY?: number): void;
  undoMove(): void;
  resetGame(): void;
  cleanup(): void;
}

