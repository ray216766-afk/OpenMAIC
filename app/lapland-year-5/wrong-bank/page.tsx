import type { Metadata } from 'next';

import { WrongBankClient } from './wrong-bank-client';

export const metadata: Metadata = {
  title: '错题题库 — Lapland Year 5',
  description: 'Wrong answers saved from Oliver Year 5 practice and the level test.',
};

export const dynamic = 'force-dynamic';

export default function WrongBankPage() {
  return <WrongBankClient />;
}
