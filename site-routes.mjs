const projectPages = [
  ['vipassana', 'papers/vipassana.html'],
  ['apartment-sublet', 'papers/apartment-sublet.html'],
  ['interval-quiz', 'papers/interval-quiz.html'],
  ['degree-quiz', 'papers/degree-quiz.html'],
  ['chord-quiz', 'papers/chord-quiz.html'],
  ['chord-trainer', 'papers/chord-trainer.html'],
  ['left-hand-voicing-trainer', 'papers/left-hand-voicing-trainer.html']
];

const essayPages = [
  ['long-term-plans', 'essays/long-term-plans.html'],
  ['why-berklee', 'essays/why-berklee.html'],
  ['why-mpe', 'essays/why-mpe.html']
];

const projectScripts = [
  ['interval-quiz.js', 'papers/interval-quiz.js'],
  ['degree-quiz.js', 'papers/degree-quiz.js'],
  ['chord-quiz.js', 'papers/chord-quiz.js']
];

const standalonePages = [
  ['snow-white', 'snow-white.html'],
  ['berklee', 'berklee.html'],
  ['works', 'works.html'],
  ['projects', 'projects.html'],
  ['engineering', 'engineering.html'],
  ['plans', 'plans.html'],
  ['resume', 'resume.html'],
  ['contact', 'contact.html'],
  ['timeline', 'timeline.html'],
  ['highlights', 'highlights.html'],
  ['interests', 'interests.html'],
  ['year-review', 'year-review.html'],
  ['financial-dashboard', 'financial-dashboard.html']
];

export const routeAliases = [
  ['/projects/socialpulse', 'projects/socialpulse.html'],
  ['/essays', 'essays/index.html'],
  ['/essays/', 'essays/index.html'],
  ...essayPages.flatMap(([slug, destination]) => [
    [`/essays/${slug}`, destination],
    [`/essays/${slug}.html`, destination]
  ]),
  ...standalonePages.flatMap(([slug, destination]) => [
    [`/${slug}`, destination],
    [`/${slug}.html`, destination]
  ]),
  ...projectScripts.map(([source, destination]) => [`/projects/${source}`, destination]),
  ...projectPages.flatMap(([slug, destination]) => [
    [`/projects/${slug}`, destination],
    [`/projects/${slug}.html`, destination]
  ])
];

export const routeAliasPrefixes = [
  ['/projects/chord-trainer-assets/', 'papers/chord-trainer-assets/'],
  ['/projects/left-hand-voicing-trainer-assets/', 'papers/left-hand-voicing-trainer-assets/']
];

export const legacyRedirects = [
  ['/papers/vipassana.html', '/projects/vipassana'],
  ['/papers/apartment-sublet.html', '/projects/apartment-sublet'],
  ['/papers/interval-quiz', '/projects/interval-quiz'],
  ['/papers/interval-quiz.html', '/projects/interval-quiz'],
  ['/papers/degree-quiz.html', '/projects/degree-quiz'],
  ['/papers/chord-quiz.html', '/projects/chord-quiz'],
  ['/papers/chord-trainer', '/projects/chord-trainer'],
  ['/papers/chord-trainer.html', '/projects/chord-trainer'],
  ['/papers/left-hand-voicing-trainer', '/projects/left-hand-voicing-trainer'],
  ['/papers/left-hand-voicing-trainer.html', '/projects/left-hand-voicing-trainer']
];

export const cacheHeaders = [
  {
    source: '/(.*)\\.(css|js)',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=86400, stale-while-revalidate=604800'
      }
    ]
  },
  {
    source: '/(.*)\\.(avif|webp|png|jpg|jpeg|gif|svg|ico|woff|woff2)',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=604800, stale-while-revalidate=2592000'
      }
    ]
  }
];

export const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  }
];

export function cleanRoutePath(urlPath) {
  const pathOnly = String(urlPath || '').split('?')[0];

  try {
    return decodeURIComponent(pathOnly);
  } catch {
    return pathOnly;
  }
}

export function findRouteAlias(urlPath) {
  const cleaned = cleanRoutePath(urlPath);
  const exact = routeAliases.find(([source]) => source === cleaned);
  if (exact) {
    return exact[1];
  }

  for (const [sourcePrefix, destinationPrefix] of routeAliasPrefixes) {
    if (cleaned.startsWith(sourcePrefix)) {
      return `${destinationPrefix}${cleaned.slice(sourcePrefix.length)}`;
    }
  }

  return null;
}

function withLeadingSlash(value) {
  return value.startsWith('/') || value.startsWith('http') ? value : `/${value}`;
}

export function buildVercelConfig() {
  return {
    version: 2,
    rewrites: [
      ...routeAliases.map(([source, destination]) => ({
        source,
        destination: withLeadingSlash(destination)
      })),
      ...routeAliasPrefixes.map(([sourcePrefix, destinationPrefix]) => ({
        source: `${sourcePrefix}(.*)`,
        destination: `${withLeadingSlash(destinationPrefix)}$1`
      }))
    ],
    redirects: [
      ...legacyRedirects.map(([source, destination]) => ({
        source,
        destination,
        permanent: true
      })),
      {
        source: '/(.*)',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http'
          }
        ],
        destination: 'https://thisisyz.com/$1',
        permanent: true
      }
    ],
    headers: [
      ...cacheHeaders,
      {
        source: '/(.*)',
        headers: securityHeaders
      }
    ]
  };
}
