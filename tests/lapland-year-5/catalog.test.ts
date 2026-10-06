import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/lapland-year-5/docx/route';
import {
  LAPLAND_YEAR_5_ROUTE,
  attachWordDocs,
  buildCatalog,
  groupTests,
  loadCatalog,
  parseInventory,
  resolvePracticeDocx,
  strandFor,
  titleSlug,
} from '@/lib/lapland-year-5/catalog';

describe('Lapland Year 5 practice catalog', () => {
  it('exposes the browse route used by the page', () => {
    expect(LAPLAND_YEAR_5_ROUTE).toBe('/lapland-year-5');
  });

  it('marks Conventions and Numeracy Practice Word docs and leaves Reading unuploaded', () => {
    const catalog = loadCatalog();

    expect(catalog.practice).toHaveLength(60);
    expect(catalog.other).toHaveLength(13);
    expect(catalog.practice.filter((test) => test.wordDoc)).toHaveLength(48);
    expect(catalog.other.every((test) => test.wordDoc === null)).toBe(true);

    const conventions = catalog.practice.filter(
      (test) => test.subject === 'Conventions of Language',
    );
    expect(conventions).toHaveLength(24);
    expect(conventions.every((test) => test.wordDoc)).toBe(true);

    const grammarNine = catalog.practice.find(
      (test) => test.title === 'Year 5 Grammar & Punctuation Test 09',
    );
    expect(grammarNine?.level).toBe('Advanced');
    expect(grammarNine?.wordDoc?.relativePath).toBe(
      'Conventions-of-Language/Advanced/Year-5-Grammar-and-Punctuation-Test-09.docx',
    );
    const spellingTwelve = catalog.practice.find(
      (test) => test.title === 'Year 5 Spelling Test 12',
    );
    expect(spellingTwelve?.wordDoc?.relativePath).toBe(
      'Conventions-of-Language/Advanced/Year-5-Spelling-Test-12.docx',
    );
    const measurement = catalog.practice.find(
      (test) => test.title === 'Year 5 Measurement & Geometry 01',
    );
    expect(measurement?.wordDoc?.relativePath).toBe(
      'Numeracy/Standard/Year_5_Measurement___Geometry_Test_01.docx',
    );
    const algebra = catalog.practice.find((test) => test.title === 'Year 5 Number & Algebra 09');
    expect(algebra?.wordDoc?.relativePath).toBe(
      'Numeracy/Advanced/Year_5_Number___Algebra_Test_09.docx',
    );
    const probability = catalog.practice.find(
      (test) => test.title === 'Year 5 Statistics & Probability 02',
    );
    expect(probability?.wordDoc?.relativePath).toBe(
      'Numeracy/Intermediate/Year_5_Statistics___Probability_Test_02.docx',
    );
    const reading = catalog.practice.find((test) => test.title === 'Year 5 Reading Test 01');
    expect(reading?.wordDoc).toBeNull();
    expect(titleSlug('Year_5_Measurement___Geometry_Test_01.docx')).toBe(
      titleSlug('Year 5 Measurement & Geometry 01'),
    );
  });

  it('groups practice tests by subject, level, and strand', () => {
    const groups = groupTests(loadCatalog().practice);
    expect(groups.map((group) => group.subject)).toEqual([
      'Conventions of Language',
      'Numeracy',
      'Reading',
    ]);
    expect(groups[0]?.levels.map((level) => level.level)).toEqual([
      'Standard',
      'Intermediate',
      'Advanced',
    ]);
    expect(groups[0]?.levels[0]?.strands.map((strand) => strand.strand)).toEqual([
      'Grammar & Punctuation',
      'Spelling',
    ]);
    expect(groups[1]?.levels[0]?.strands.map((strand) => strand.strand)).toEqual([
      'Measurement & Geometry',
      'Number & Algebra',
      'Statistics & Probability',
    ]);
    expect(groups[0]?.testCount).toBe(24);
    expect(groups[0]?.wordDocCount).toBe(24);
    expect(groups[0]?.levels.find((level) => level.level === 'Standard')?.wordDocCount).toBe(8);
    expect(groups[0]?.levels.find((level) => level.level === 'Intermediate')?.wordDocCount).toBe(8);
    expect(groups[0]?.levels.find((level) => level.level === 'Advanced')?.wordDocCount).toBe(8);
    expect(groups[1]?.wordDocCount).toBe(24);
    expect(groups[1]?.levels.find((level) => level.level === 'Standard')?.wordDocCount).toBe(8);
    expect(groups[1]?.levels.find((level) => level.level === 'Intermediate')?.wordDocCount).toBe(8);
    expect(groups[1]?.levels.find((level) => level.level === 'Advanced')?.wordDocCount).toBe(8);
    expect(groups[2]?.testCount).toBe(12);
  });

  it('keeps sample and written rows out of practice downloads even if a file slug matches', () => {
    const tests = parseInventory(
      [
        'pack,subject,level,test_type,title,questions,minutes',
        'Pack,Reading,Mixed,Sample Test,Year 5 Reading Test 13,39,50',
        'Pack,Writing,Mixed,Written Test,Year 5 Writing Test 01,1,42',
        'Pack,Reading,Standard,Practice Test,Year 5 Reading Test 01,7,9',
      ].join('\n'),
    );
    const catalog = buildCatalog(tests, [
      {
        fileName: 'Year-5-Reading-Test-13.docx',
        relativePath: 'Reading/Mixed/Year-5-Reading-Test-13.docx',
        slug: titleSlug('Year 5 Reading Test 13'),
      },
      {
        fileName: 'Year-5-Reading-Test-01.docx',
        relativePath: 'Reading/Standard/Year-5-Reading-Test-01.docx',
        slug: titleSlug('Year 5 Reading Test 01'),
      },
    ]);

    expect(catalog.other.map((test) => test.wordDoc)).toEqual([null, null]);
    expect(catalog.practice[0]?.wordDoc?.fileName).toBe('Year-5-Reading-Test-01.docx');
    expect(strandFor('Numeracy', 'Year 5 Number & Algebra 01')).toBe('Number & Algebra');
  });

  it('serves an uploaded practice docx and refuses other paths', async () => {
    const catalog = loadCatalog();
    const spelling = catalog.practice.find((test) => test.title === 'Year 5 Spelling Test 01');
    expect(spelling?.wordDoc?.relativePath).toBe(
      'Conventions-of-Language/Standard/Year-5-Spelling-Test-01.docx',
    );

    const ok = await GET(
      new Request(
        `http://localhost/api/lapland-year-5/docx?file=${encodeURIComponent(spelling!.wordDoc!.relativePath)}`,
      ),
    );
    expect(ok.status).toBe(200);
    expect(ok.headers.get('content-type')).toContain('wordprocessingml');
    const body = Buffer.from(await ok.arrayBuffer());
    expect(body.subarray(0, 2).toString()).toBe('PK');

    const traversal = await GET(
      new Request('http://localhost/api/lapland-year-5/docx?file=../../package.json'),
    );
    expect(traversal.status).toBe(404);

    expect(resolvePracticeDocx('Reading/Mixed/Year-5-Reading-Test-13.docx', catalog)).toBeNull();
    expect(attachWordDocs([], [])).toEqual([]);
  });
});
