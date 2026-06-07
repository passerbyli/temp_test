import type { Page } from 'playwright';

export interface EChartsSnapshot {
  index: number;
  title: string;
  legend: string[];
  xAxis: string[];
  series: { name: string; type: string; data: string[] }[];
  colors: string[];
}

function formatSnapshot(snapshot: EChartsSnapshot): string {
  const lines: string[] = [];
  lines.push(`[Chart ${snapshot.index}] ${snapshot.title || '(untitled)'}`);
  if (snapshot.legend.length) lines.push(`  Legend: ${snapshot.legend.join(', ')}`);
  if (snapshot.xAxis.length) lines.push(`  XAxis: ${snapshot.xAxis.join(', ')}`);
  for (const s of snapshot.series) {
    lines.push(`  Series "${s.name}" (${s.type}): ${s.data.join(', ')}`);
  }
  if (snapshot.colors.length) lines.push(`  Colors: ${snapshot.colors.join(', ')}`);
  return lines.join('\n');
}

export async function extractEChartsData(page: Page): Promise<string> {
  try {
    const snapshots = await page.evaluate(() => {
      const results: { index: number; title: string; legend: string[]; xAxis: string[]; series: { name: string; type: string; data: string[] }[]; colors: string[] }[] = [];
      const seen = new Set<any>();

      function pushResult(instance: any, index: number): boolean {
        if (!instance || seen.has(instance)) return false;
        seen.add(instance);
        try {
          const option = instance.getOption();
          if (!option) return false;
          const titleObj = Array.isArray(option.title) ? option.title[0] : option.title;
          const title = titleObj?.text ?? titleObj?.subtext ?? '';
          const legendObj = Array.isArray(option.legend) ? option.legend[0] : option.legend;
          const legend: string[] = legendObj?.data ?? [];
          const xAxisObj = Array.isArray(option.xAxis) ? option.xAxis[0] : option.xAxis;
          const xAxis: string[] = xAxisObj?.data ?? [];
          const colors: string[] = option.color ?? [];
          const series = (option.series ?? []).map((s: any) => ({
            name: s.name ?? '',
            type: s.type ?? '',
            data: Array.isArray(s.data)
              ? s.data.map((d: any) => {
                  if (d === null || d === undefined) return 'null';
                  if (typeof d === 'object') return JSON.stringify(d.value ?? d);
                  return String(d);
                })
              : [],
          }));
          results.push({ index, title, legend, xAxis, series, colors });
          return true;
        } catch { return false; }
      }

      const echarts = (window as any).echarts;
      let idx = 0;

      // Strategy 1: Elements with _echarts_instance_ attribute — check Vue data
      document.querySelectorAll('[_echarts_instance_]').forEach(el => {
        // Try echarts.getInstanceByDom first
        if (echarts && typeof echarts.getInstanceByDom === 'function') {
          try {
            const inst = echarts.getInstanceByDom(el);
            if (inst && pushResult(inst, idx)) { idx++; return; }
          } catch {}
        }
        // Try Vue component data (common pattern: vm.$data.dom = echarts instance)
        const vm = (el as any).__vue__;
        if (vm) {
          const data = vm.$data || {};
          for (const key of Object.keys(data)) {
            const val = data[key];
            if (val && typeof val.getOption === 'function' && typeof val.setOption === 'function') {
              if (pushResult(val, idx)) { idx++; return; }
            }
          }
          // Also check vm properties directly
          for (const key of Object.keys(vm)) {
            if (key.startsWith('_') || key.startsWith('$')) continue;
            try {
              const val = vm[key];
              if (val && typeof val.getOption === 'function' && typeof val.setOption === 'function') {
                if (pushResult(val, idx)) { idx++; return; }
              }
            } catch {}
          }
        }
      });
      if (results.length > 0) return results;

      // Strategy 2: Canvas elements — walk up ancestors
      document.querySelectorAll('canvas').forEach(canvas => {
        let el: Element | null = canvas;
        for (let d = 0; el && d < 6; d++) {
          if (echarts && typeof echarts.getInstanceByDom === 'function') {
            try {
              const inst = echarts.getInstanceByDom(el);
              if (inst && pushResult(inst, idx)) { idx++; break; }
            } catch {}
          }
          const vm = (el as any).__vue__;
          if (vm) {
            const data = vm.$data || {};
            for (const key of Object.keys(data)) {
              const val = data[key];
              if (val && typeof val.getOption === 'function') {
                if (pushResult(val, idx)) { idx++; break; }
              }
            }
            if (results.length > 0) break;
          }
          el = el.parentElement;
        }
      });

      return results;
    });

    if (!snapshots || snapshots.length === 0) return '';
    return snapshots.map(formatSnapshot).join('\n\n');
  } catch {
    return '';
  }
}
