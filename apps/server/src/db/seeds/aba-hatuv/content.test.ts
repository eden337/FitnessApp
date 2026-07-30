import { readSeedBundle } from '../../seedLoader.js';

describe('Aba Hatuv v1 authored content', () => {
  it('has complete bilingual guidance and tasks for every supplied week', async () => {
    const bundle = await readSeedBundle('v1');

    expect(bundle.weeks.map((week) => week.weekNumber)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13,
    ]);
    for (const week of bundle.weeks) {
      expect(week.rationale?.he).toBeTruthy();
      expect(week.rationale?.en).toBeTruthy();
      expect(week.notes?.he).toBeTruthy();
      expect(week.notes?.en).toBeTruthy();
      expect(week.tasks.length).toBeGreaterThan(0);
      for (const task of week.tasks) {
        expect(task.title.he).toBeTruthy();
        expect(task.title.en).toBeTruthy();
      }
    }
  });

  it('includes the authoritative vegetable and fruit references', async () => {
    const bundle = await readSeedBundle('v1');
    const vegetables = bundle.lists.find((list) => list.slug === 'cleansing-vegetables');
    const fruits = bundle.lists.find((list) => list.slug === 'fruits');

    expect(vegetables?.items).toHaveLength(34);
    expect(vegetables?.items.map((item) => item.name.en)).toEqual(
      expect.arrayContaining(['Artichoke', 'Broccoli', 'Baby corn', 'Spinach']),
    );
    expect(fruits?.items.length).toBeGreaterThanOrEqual(30);
    expect(fruits?.items.find((item) => item.name.en === 'Apple')?.portion?.en).toBe('1');
    expect(fruits?.items.find((item) => item.name.en === 'Dried fruit')?.notes?.en).toContain(
      'indulgence meal',
    );
  });

  it('assigns a supported illustration to every food item', async () => {
    const bundle = await readSeedBundle('v1');
    const items = bundle.lists.flatMap((list) => list.items);

    expect(items).toHaveLength(105);
    expect(new Set(items.map((item) => item.visualKey)).size).toBe(items.length);
    for (const item of items) {
      expect(item.visualKey).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });
});
