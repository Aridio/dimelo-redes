'use client';

import { FC } from 'react';
import { create } from 'zustand';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

// TikTok requires its declaration right before the publish button. Each TikTok
// channel's settings report here whether it posts directly and as branded content.
interface Declaration {
  direct: boolean;
  branded: boolean;
}

export const useTikTokDeclaration = create<{
  channels: Record<string, Declaration>;
  set: (id: string, value: Declaration) => void;
}>((set) => ({
  channels: {},
  set: (id, value) =>
    set((state) => ({ channels: { ...state.channels, [id]: value } })),
}));

const linkClass = 'text-[#B69DEC] hover:underline';

export const TikTokDeclaration: FC<{
  integrations: string[];
  className?: string;
}> = ({ integrations, className }) => {
  const t = useT();
  const channels = useTikTokDeclaration((s) => s.channels);
  // a TikTok channel counts as posting directly until its settings say otherwise
  const active = integrations.map(
    (id) => channels[id] || { direct: true, branded: false }
  );
  if (!active.length || !active.some((p) => p.direct)) {
    return null;
  }
  const branded = active.some((p) => p.direct && p.branded);

  const music = (
    <a
      target="_blank"
      rel="noreferrer"
      className={linkClass}
      href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en"
    >
      {t('tiktok_music_usage_confirmation', 'Music Usage Confirmation')}
    </a>
  );

  return (
    <div className={className}>
      <div className="text-[13px] text-balance">
      {t('tiktok_by_posting_you_agree', "By posting, you agree to TikTok's")}{' '}
      {branded && (
        <>
          <a
            target="_blank"
            rel="noreferrer"
            className={linkClass}
            href="https://www.tiktok.com/legal/page/global/bc-policy/en"
          >
            {t('tiktok_branded_content_policy', 'Branded Content Policy')}
          </a>{' '}
          {t('tiktok_and_the', 'and')}{' '}
        </>
      )}
      {music}
      {t('tiktok_declaration_end', '.')}
      </div>
    </div>
  );
};
