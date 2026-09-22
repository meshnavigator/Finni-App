import { createElement, type ComponentType, type ReactElement } from 'react';
import type { LessonMechanic } from '../domain/lesson.ts';

export type LessonRendererProps = Readonly<{
  lessonId: string;
  parameters: Readonly<Record<string, unknown>>;
  solution: Readonly<Record<string, unknown>>;
  disabled: boolean;
  onChange: (solution: Readonly<Record<string, unknown>>) => void;
  evidence?: readonly Readonly<{ id: string; text: string }>[];
  revealedEvidenceIds?: readonly string[];
  onRevealEvidence?: (evidenceId: string) => void;
}>;

export type LessonRenderer = ComponentType<LessonRendererProps>;

/** UI mechanics register independently; LessonShell and navigation stay unchanged. */
export class LessonRendererRegistry {
  readonly #renderers = new Map<LessonMechanic, LessonRenderer>();

  register(mechanic: LessonMechanic, renderer: LessonRenderer): this {
    if (this.#renderers.has(mechanic)) {
      throw new TypeError(`Renderer already registered for ${mechanic}`);
    }
    this.#renderers.set(mechanic, renderer);
    return this;
  }

  resolve(mechanic: LessonMechanic): LessonRenderer {
    const renderer = this.#renderers.get(mechanic);
    if (!renderer) throw new TypeError(`No renderer registered for ${mechanic}`);
    return renderer;
  }

  render(
    mechanic: LessonMechanic,
    props: LessonRendererProps,
  ): ReactElement {
    return createElement(this.resolve(mechanic), props);
  }

  has(mechanic: LessonMechanic): boolean {
    return this.#renderers.has(mechanic);
  }
}
