import { addDays } from 'date-fns';
import * as d3 from 'd3';
import { zonedTimeToUtc } from 'date-fns-tz';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BookingFormValue } from '../models/booking.model';
import {
  buildTimelinePreviewState,
  clipOccurrenceToRange,
  formatTimelineDate,
  getWeekRangeUtc,
  listWeekTickValues,
  TimelinePreviewState,
} from '../utils/timeline-preview.utils';

@Component({
  selector: 'app-timeline-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <section class="timeline-preview">
      <div class="preview-header">
        <div>
          <h3>Preview</h3>
          @if (timelineState()) {
            <p>{{ weekLabel() }}</p>
          } @else {
            <p>Set from, to and timezone to draw the range boundaries.</p>
          }
        </div>

        @if (timelineState(); as state) {
          <p class="occurrence-count">
            {{
              state.isRecurrenceReady
                ? state.occurrences.length + ' occurrences'
                : 'Add start time, duration and days to render events'
            }}
          </p>
        }
      </div>

      <div #chartHost class="chart-shell">
        <svg #svg class="chart" aria-label="Booking recurrence timeline preview"></svg>

        @if (!timelineState()) {
          <p class="chart-placeholder">
            The axis appears here as soon as the time window is valid.
          </p>
        }
      </div>

      @if (timelineState()) {
        <div class="controls">
          <span class="week-position">{{ weekPositionLabel() }}</span>

          <button
            mat-icon-button
            aria-label="Go to first week"
            [disabled]="!canGoPrevious()"
            (click)="goToFirstWeek()"
          >
            <mat-icon>first_page</mat-icon>
          </button>

          <button
            mat-icon-button
            aria-label="Go to previous week"
            [disabled]="!canGoPrevious()"
            (click)="goToPreviousWeek()"
          >
            <mat-icon>chevron_left</mat-icon>
          </button>

          <button
            mat-icon-button
            aria-label="Go to next week"
            [disabled]="!canGoNext()"
            (click)="goToNextWeek()"
          >
            <mat-icon>chevron_right</mat-icon>
          </button>

          <button
            mat-icon-button
            aria-label="Go to last week"
            [disabled]="!canGoNext()"
            (click)="goToLastWeek()"
          >
            <mat-icon>last_page</mat-icon>
          </button>
        </div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .timeline-preview {
      display: grid;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;

      h3 {
        font-size: 1rem;
        font-weight: 600;
        color: #0f172a;
        margin: 0 0 0.25rem 0;
      }

      p {
        font-size: 0.875rem;
        color: #475569;
        margin: 0;
      }
    }

    .occurrence-count {
      white-space: nowrap;
    }

    .chart-shell {
      position: relative;
      width: 100%;
      min-height: 120px;
      overflow: hidden;
      border-radius: 12px;
      border: 1px solid #dbe5f0;
      background: #f8fbff;
    }

    .chart {
      display: block;
      width: 100%;
      height: 120px;
    }

    .chart-placeholder {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      margin: 0;
      padding: 1rem;
      text-align: center;
      font-size: 0.875rem;
      color: #64748b;
      pointer-events: none;
    }

    .controls {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .week-position {
      margin-right: auto;
      font-size: 0.875rem;
      color: #475569;
    }
  `,
})
export class TimelinePreviewComponent implements AfterViewInit {
  private static readonly chartHeight = 120;

  readonly booking = input<BookingFormValue | null>(null);

  readonly timelineState = computed(() => buildTimelinePreviewState(this.booking()));
  readonly weekIndex = signal(0);
  readonly containerWidth = signal(0);
  readonly canGoPrevious = computed(() => this.weekIndex() > 0);
  readonly canGoNext = computed(() => {
    const totalWeeks = this.timelineState()?.weekStarts.length ?? 0;
    return this.weekIndex() < totalWeeks - 1;
  });
  readonly currentWeekStart = computed(() => {
    const state = this.timelineState();

    if (!state) {
      return null;
    }

    return state.weekStarts[this.weekIndex()] ?? state.weekStarts[0] ?? null;
  });
  readonly weekLabel = computed(() => {
    const state = this.timelineState();
    const weekStart = this.currentWeekStart();

    if (!state || !weekStart) {
      return '';
    }

    const startUtc = zonedTimeToUtc(weekStart, state.timezone);
    const endUtc = zonedTimeToUtc(addDays(weekStart, 6), state.timezone);

    return `${formatTimelineDate(startUtc, state.timezone, {
      day: '2-digit',
      month: 'short',
      weekday: 'short',
    })} - ${formatTimelineDate(endUtc, state.timezone, {
      day: '2-digit',
      month: 'short',
      weekday: 'short',
    })}`;
  });
  readonly weekPositionLabel = computed(() => {
    const totalWeeks = this.timelineState()?.weekStarts.length ?? 0;

    if (!totalWeeks) {
      return '';
    }

    return `Week ${this.weekIndex() + 1} / ${totalWeeks}`;
  });

  @ViewChild('chartHost') private chartHost?: ElementRef<HTMLDivElement>;
  @ViewChild('svg') private svg?: ElementRef<SVGSVGElement>;

  private readonly destroyRef = inject(DestroyRef);
  private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      this.timelineState();

      untracked(() => {
        this.weekIndex.set(0);
      });
    });

    effect(() => {
      const state = this.timelineState();
      const weekStart = this.currentWeekStart();
      const width = this.containerWidth();

      if (!state || !weekStart || !this.svg || width <= 0) {
        this.clearChart();
        return;
      }

      untracked(() => {
        this.renderChart(state, weekStart, width);
      });
    });

    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
    });
  }

  ngAfterViewInit() {
    const host = this.chartHost?.nativeElement;

    if (!host) {
      return;
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? host.clientWidth;
      this.setContainerWidth(width);
    });

    this.resizeObserver.observe(host);

    const frameId = requestAnimationFrame(() => {
      this.setContainerWidth(host.clientWidth);
    });

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(frameId);
    });
  }

  private setContainerWidth(width: number) {
    this.containerWidth.set(Math.max(0, Math.floor(width)));
  }

  goToFirstWeek() {
    this.weekIndex.set(0);
  }

  goToLastWeek() {
    const totalWeeks = this.timelineState()?.weekStarts.length ?? 0;

    if (totalWeeks > 0) {
      this.weekIndex.set(totalWeeks - 1);
    }
  }

  goToPreviousWeek() {
    if (this.canGoPrevious()) {
      this.weekIndex.update((index) => index - 1);
    }
  }

  goToNextWeek() {
    if (this.canGoNext()) {
      this.weekIndex.update((index) => index + 1);
    }
  }

  private clearChart() {
    const svg = this.svg?.nativeElement;

    if (svg) {
      d3.select(svg).selectAll('*').remove();
    }
  }

  private renderChart(state: TimelinePreviewState, weekStartZoned: Date, width: number) {
    const svgElement = this.svg?.nativeElement;

    if (!svgElement) {
      return;
    }

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();

    const height = TimelinePreviewComponent.chartHeight;
    const margin = { bottom: 20, left: 40, right: 40, top: 30 };
    const innerWidth = Math.max(120, width - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;
    const axisY = margin.top;
    const plotBottom = axisY + innerHeight;
    const boundaryEndY = plotBottom - 10;
    const eventHeight = 18;
    const eventY = axisY + innerHeight / 2 - eventHeight / 2;
    const { weekEndUtc, weekStartUtc } = getWeekRangeUtc(weekStartZoned, state.timezone);
    const visibleRangeStart = new Date(
      Math.max(state.rangeStartUtc.getTime(), weekStartUtc.getTime()),
    );
    const visibleRangeEnd = new Date(Math.min(state.rangeEndUtc.getTime(), weekEndUtc.getTime()));

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', width)
      .attr('height', height)
      .attr('preserveAspectRatio', 'xMinYMin meet');

    const xScale = d3
      .scaleTime()
      .domain([weekStartUtc, weekEndUtc])
      .range([margin.left, margin.left + innerWidth]);

    const axis = d3
      .axisTop(xScale)
      .tickValues(listWeekTickValues(weekStartZoned, state.timezone))
      .tickSize(-innerHeight)
      .tickFormat((value) => {
        const tickDate = value instanceof Date ? value : new Date(value.valueOf());

        return formatTimelineDate(tickDate, state.timezone, {
          day: '2-digit',
          weekday: 'short',
        });
      });

    const axisGroup = svg.append('g').attr('transform', `translate(0, ${axisY})`);
    axisGroup.call((selection) => {
      axis(selection);
    });

    axisGroup.select('.domain').attr('stroke', '#94a3b8');
    axisGroup.selectAll('.tick line').attr('stroke', '#dbe5f0');
    axisGroup
      .selectAll('.tick text')
      .attr('fill', '#334155')
      .attr('font-size', 11)
      .attr('dy', '-0.75em');

    for (const occurrence of state.occurrences) {
      const clipped = clipOccurrenceToRange(occurrence, visibleRangeStart, visibleRangeEnd);

      if (!clipped) {
        continue;
      }

      const startX = xScale(clipped.startUtc);
      const endX = xScale(clipped.endUtc);

      svg
        .append('rect')
        .attr('x', startX)
        .attr('y', eventY)
        .attr('width', Math.max(2, endX - startX))
        .attr('height', eventHeight)
        .attr('rx', 6)
        .attr('fill', '#7dd3fc')
        .attr('opacity', 0.95);
    }

    this.renderBoundary(svg, {
      axisY,
      boundaryEndY,
      height,
      kind: 'from',
      state,
      width,
      weekEndUtc,
      weekStartUtc,
      xScale,
    });
    this.renderBoundary(svg, {
      axisY,
      boundaryEndY,
      height,
      kind: 'to',
      state,
      width,
      weekEndUtc,
      weekStartUtc,
      xScale,
    });
  }

  private renderBoundary(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    args: {
      axisY: number;
      boundaryEndY: number;
      height: number;
      kind: 'from' | 'to';
      state: TimelinePreviewState;
      weekEndUtc: Date;
      weekStartUtc: Date;
      width: number;
      xScale: d3.ScaleTime<number, number>;
    },
  ) {
    const boundaryDate = args.kind === 'from' ? args.state.rangeStartUtc : args.state.rangeEndUtc;

    if (
      boundaryDate.getTime() < args.weekStartUtc.getTime() ||
      boundaryDate.getTime() > args.weekEndUtc.getTime()
    ) {
      return;
    }

    const x = args.xScale(boundaryDate);
    const label = `${args.kind === 'from' ? 'From' : 'To'} ${formatTimelineDate(
      boundaryDate,
      args.state.timezone,
      {
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
      },
    )}`;
    const textAnchor = x < 72 ? 'start' : x > args.width - 72 ? 'end' : 'middle';

    svg
      .append('line')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', args.axisY)
      .attr('y2', args.boundaryEndY)
      .attr('stroke', '#dc2626')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 4');

    svg
      .append('text')
      .attr('x', x)
      .attr('y', Math.min(args.height - 8, args.boundaryEndY + 18))
      .attr('text-anchor', textAnchor)
      .attr('font-size', 11)
      .attr('fill', '#b91c1c')
      .text(label);
  }
}
