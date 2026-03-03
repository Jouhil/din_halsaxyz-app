let cachedGuideItems = null;

function textFromHtml(html = '') {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return (temp.textContent || '').replace(/\s+/g, ' ').trim();
}

function parseHelpDom() {
  const root = document.getElementById('help-results');
  if (!root) return [];

  const items = [];
  root.querySelectorAll('.help-item').forEach((itemEl) => {
    const detailEl = itemEl.nextElementSibling;
    const title = itemEl.querySelector('.help-item-title')?.textContent?.trim() || '';
    const preview = itemEl.querySelector('.help-item-preview')?.textContent?.trim() || '';
    const tags = [...itemEl.querySelectorAll('.help-tag')].map((tag) => tag.textContent?.trim().toLowerCase()).filter(Boolean);
    const detailText = textFromHtml(detailEl?.querySelector('.help-detail-text')?.innerHTML || '');
    const id = detailEl?.id?.replace('hd-', '') || title.toLowerCase();

    items.push({
      id,
      title,
      text: preview,
      detailText,
      tags,
      needs: [],
      kind: title.toLowerCase().includes('tankefälla') ? 'trap' : 'tool',
      ctaLabel: 'Testa nu',
      ctaAction: detailText,
    });
  });

  return items;
}

function buildGuideIndex() {
  if (cachedGuideItems) return cachedGuideItems;

  const parsed = parseHelpDom();
  const contextual = [
    {
      id: 'tools_intro',
      title: 'Guide: välj verktyg efter behov',
      text: 'Börja med ett verktyg som matchar hur det känns just nu, hellre enkelt än perfekt.',
      detailText: 'Om stressen är hög: börja med andning. Om tankar snurrar: välj ett resonemangsverktyg. Om energin är låg: välj en kort aktiverande övning.',
      tags: ['verktyg', 'start', 'val'],
      needs: ['stress', 'tankar', 'energi'],
      kind: 'intro',
      ctaLabel: 'Testa nu',
      ctaAction: 'Välj ett verktyg och sätt en timer på 2 minuter.',
    },
    {
      id: 'perspective_why',
      title: 'Varför perspektiv hjälper',
      text: 'Ett kort perspektivskifte kan minska tryck och göra nästa steg lättare.',
      detailText: 'Tacksamhet lugnar nervsystemet och pepp stärker riktning. Små mentala skiften gör ofta stor skillnad i vardagen.',
      tags: ['perspektiv', 'tacksamhet', 'pepp'],
      needs: ['humör', 'tankar'],
      kind: 'why',
      ctaLabel: 'Testa nu',
      ctaAction: 'Välj Tacksam eller Pepp och stanna i 60 sekunder.',
    },
  ];

  cachedGuideItems = [...contextual, ...parsed];
  return cachedGuideItems;
}

function needKeywords(need) {
  const map = {
    stress: ['stress', 'oro', 'ångest', 'katastrof'],
    humör: ['humör', 'självkritik', 'känsla', 'negativ'],
    energi: ['energi', 'trött', 'paus', 'återhämtning'],
    sömn: ['sömn', 'vila', 'kväll', 'trötthet'],
    tankar: ['tankar', 'grubbel', 'tankefälla', 'perspektiv'],
  };
  return map[need] || [];
}

function scoreItem(item, { tag, need }) {
  let score = 0;
  const haystack = `${item.title} ${item.text} ${item.detailText} ${item.tags.join(' ')}`.toLowerCase();

  if (tag && item.tags.some((t) => t.includes(tag.toLowerCase()))) score += 4;
  if (need) {
    const keywords = needKeywords(need);
    keywords.forEach((kw) => {
      if (haystack.includes(kw)) score += 2;
    });
  }

  return score;
}

export function init() {}
export function render() {}

export function getGuideItems({ need, tag, topic, limit = 3 } = {}) {
  const allItems = buildGuideIndex();

  if (topic) {
    const t = topic.toLowerCase();
    const topicMatches = allItems.filter((item) => item.id.toLowerCase() === t || item.title.toLowerCase() === t);
    if (topicMatches.length) return topicMatches.slice(0, limit);
  }

  if (tag) {
    const t = tag.toLowerCase();
    const tagMatches = allItems.filter((item) => item.tags.some((itemTag) => itemTag.includes(t)));
    if (tagMatches.length) return tagMatches.slice(0, limit);
  }

  if (need) {
    return [...allItems]
      .map((item) => ({ item, score: scoreItem(item, { need, tag }) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((row) => row.item);
  }

  return allItems.slice(0, limit);
}
