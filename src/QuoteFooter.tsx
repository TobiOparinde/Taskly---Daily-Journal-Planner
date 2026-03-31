import type { FC } from 'react';
import { getDailyQuote } from './quotes';
import { toDateStr } from './dateUtils';

interface Props {
  dateStr?: string;
}

export const QuoteFooter: FC<Props> = ({ dateStr }) => {
  const rawQuote = getDailyQuote(dateStr ?? toDateStr(new Date()));
  const [quoteText, authorText] = rawQuote.split(' — ');
  const author = authorText?.trim();
  return (
    <div className="px-1 pt-3 pb-1 text-center">
      <p className="text-[15px] text-stone-500/70 italic leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, Times New Roman, serif' }}>
        {quoteText}
      </p>
      {author && (
        <p className="mt-0.5 text-[12px] font-semibold text-stone-500/75" style={{ fontFamily: 'Cormorant Garamond, Times New Roman, serif' }}>
          {author}
        </p>
      )}
    </div>
  );
};
