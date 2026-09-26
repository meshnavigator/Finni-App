import type { CommandReceipt, Mode, MoneySnapshot } from '../domain/contracts.ts';

export type PresentationSession = Readonly<{
  profileId: string | null;
  mode: Mode;
  sessionEpoch: number;
}>;

export type PresentationEvent = Readonly<{
  id: number;
  commandId: string;
  profileId: string;
  mode: Mode;
  sessionEpoch: number;
  revision: number;
  commandType: CommandReceipt['commandType'];
  before: MoneySnapshot;
  after: MoneySnapshot;
  expression: 'happy' | 'thoughtful' | 'inspired';
  skippable: boolean;
  priority: number;
}>;

function effectFor(receipt: CommandReceipt): Pick<PresentationEvent, 'expression' | 'skippable' | 'priority'> | null {
  if (!receipt.result.ok) return null;
  switch (receipt.commandType) {
    case 'ConfirmPurchase': return { expression: 'happy', skippable: false, priority: 80 };
    case 'SelectGoal': return receipt.result.feedback.params.goalId === 'none'
      ? null : { expression: 'thoughtful', skippable: false, priority: 70 };
    case 'DepositSavings': return { expression: 'inspired', skippable: false, priority: 80 };
    case 'WithdrawSavings': return { expression: 'thoughtful', skippable: false, priority: 80 };
    case 'ClaimGoal': return { expression: 'inspired', skippable: true, priority: 100 };
    case 'CompleteLesson': return receipt.result.feedback.code === 'LESSON_REWARD_GRANTED'
      ? { expression: 'happy', skippable: false, priority: 80 } : null;
    case 'ClosePeriod': {
      const summary = (receipt.result.data as { summary?: { stageBefore?: number; stageAfter?: number; periodGrowth?: number } }).summary;
      if (summary && typeof summary.stageBefore === 'number' && typeof summary.stageAfter === 'number'
        && summary.stageAfter > summary.stageBefore) {
        return { expression: 'inspired', skippable: true, priority: 100 };
      }
      return summary && typeof summary.periodGrowth === 'number' && summary.periodGrowth > 0
        ? { expression: 'happy', skippable: false, priority: 80 } : null;
    }
    default: return null;
  }
}

/** Receipts are already committed. Playback has no callback into the command layer. */
export class ReceiptPresentationController {
  #session: PresentationSession | null = null;
  #seen = new Set<string>();
  #queue: PresentationEvent[] = [];
  #active: PresentationEvent | null = null;
  #serial = 0;

  bind(session: PresentationSession): void {
    if (this.#session?.profileId === session.profileId && this.#session.mode === session.mode
      && this.#session.sessionEpoch === session.sessionEpoch) return;
    this.#session = session;
    this.#seen.clear();
    this.cancel();
  }

  accept(receipt: CommandReceipt, captured: PresentationSession, visibleRevision: number): boolean {
    const session = this.#session;
    if (!session || !receipt.result.ok || !receipt.profileId || !receipt.commandId
      || receipt.profileId !== session.profileId || receipt.profileId !== captured.profileId
      || receipt.mode !== session.mode || receipt.mode !== captured.mode
      || captured.sessionEpoch !== session.sessionEpoch
      || !Number.isSafeInteger(visibleRevision) || visibleRevision < receipt.result.revision
      || this.#seen.has(receipt.commandId)) return false;
    this.#seen.add(receipt.commandId);
    const effect = effectFor(receipt);
    if (!effect) return false;
    const event: PresentationEvent = Object.freeze({
      ...effect,
      id: ++this.#serial,
      commandId: receipt.commandId,
      profileId: receipt.profileId,
      mode: receipt.mode,
      sessionEpoch: captured.sessionEpoch,
      revision: receipt.result.revision,
      commandType: receipt.commandType,
      before: receipt.result.before,
      after: receipt.result.after,
    });
    this.#queue.push(event);
    this.#queue.sort((a, b) => b.priority - a.priority || a.id - b.id);
    if (this.#queue.length > 4) this.#queue.length = 4;
    return true;
  }

  next(): PresentationEvent | null {
    if (this.#active) return this.#active;
    this.#active = this.#queue.shift() ?? null;
    return this.#active;
  }

  complete(id: number): PresentationEvent | null {
    if (this.#active?.id !== id) return this.#active;
    this.#active = null;
    return this.next();
  }

  cancel(): void {
    this.#active = null;
    this.#queue = [];
  }

  cancelActive(id: number): void {
    if (this.#active?.id === id) this.cancel();
  }
}
