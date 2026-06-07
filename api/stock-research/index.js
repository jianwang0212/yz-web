import { endOptions, requireMethod, sendJson } from '../_lib/http.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-5.5';
const REQUEST_TIMEOUT_MS = 90000;
const MAX_QUERY_CHARS = 80;

function getJsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body;
}

function cleanQuery(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_CHARS);
}

function tableRows(columns, minItems = 3) {
  return {
    type: 'array',
    minItems,
    maxItems: 12,
    items: {
      type: 'array',
      minItems: columns,
      maxItems: columns,
      items: { type: 'string' }
    }
  };
}

const reportSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    company: { type: 'string' },
    code: { type: 'string' },
    industry: { type: 'string' },
    title: { type: 'string' },
    subtitle: { type: 'string' },
    analysisDate: { type: 'string' },
    dataCutoff: { type: 'string' },
    sourceNote: { type: 'string' },
    snapshot: tableRows(3, 8),
    businessSegments: tableRows(4, 4),
    marginRows: tableRows(4, 4),
    riskRows: tableRows(4, 5),
    scenarios: tableRows(4, 3),
    sections: {
      type: 'array',
      minItems: 5,
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          blocks: {
            type: 'array',
            minItems: 1,
            maxItems: 4,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                heading: { type: 'string' },
                paragraphs: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 4,
                  items: { type: 'string' }
                }
              },
              required: ['heading', 'paragraphs']
            }
          }
        },
        required: ['title', 'blocks']
      }
    },
    keyFindings: {
      type: 'array',
      minItems: 4,
      maxItems: 8,
      items: { type: 'string' }
    },
    followUps: {
      type: 'array',
      minItems: 5,
      maxItems: 10,
      items: { type: 'string' }
    },
    infoGaps: {
      type: 'array',
      minItems: 4,
      maxItems: 10,
      items: { type: 'string' }
    },
    sources: {
      type: 'array',
      minItems: 3,
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          publisher: { type: 'string' },
          date: { type: 'string' },
          url: { type: 'string' },
          summary: { type: 'string' }
        },
        required: ['title', 'publisher', 'date', 'url', 'summary']
      }
    }
  },
  required: [
    'company',
    'code',
    'industry',
    'title',
    'subtitle',
    'analysisDate',
    'dataCutoff',
    'sourceNote',
    'snapshot',
    'businessSegments',
    'marginRows',
    'riskRows',
    'scenarios',
    'sections',
    'keyFindings',
    'followUps',
    'infoGaps',
    'sources'
  ]
};

function buildResearchPrompt(query) {
  const today = new Date().toISOString().slice(0, 10);
  return [
    '你是一名严谨的股票研究助理。请对用户输入的股票做实时 web research，并返回结构化 JSON 研报数据。',
    `研究对象：${query}`,
    `今天日期：${today}`,
    '',
    '要求：',
    '1. 优先检索官方来源：交易所公告、SEC/港交所/上交所/深交所、公司 IR、年报、季报、业绩公告；再补充主流财经媒体和行情来源。',
    '2. 使用最新可获得信息，所有重要财务数据必须带明确年度/季度/日期；无法核验的数据写“待核验”，不要编造。',
    '3. 报告必须包括公司概况、业务拆解、行业背景、商业模式、竞争格局、关键技术或运营能力、财务质量、估值框架、风险、后续跟踪重点。',
    '4. sources 至少给 3 个来源，url 必须是可访问链接；sourceNote 说明这是实时 research 结果，不构成投资建议。',
    '5. 用中文输出，金额保留来源币种并可附人民币/美元口径；不要给买入/卖出指令。',
    '6. 只输出符合 schema 的 JSON，不要 Markdown，不要额外解释。'
  ].join('\n');
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === 'string') return payload.output_text;
  const parts = [];
  for (const item of payload?.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === 'string') parts.push(content.text);
      if (typeof content.output_text === 'string') parts.push(content.output_text);
    }
  }
  return parts.join('\n').trim();
}

async function requestOpenAiResearch(query) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 501,
      body: { ok: false, error: 'OPENAI_API_KEY is not configured.' }
    };
  }

  const body = {
    model: process.env.STOCK_RESEARCH_MODEL || DEFAULT_MODEL,
    tools: [{ type: 'web_search', external_web_access: true }],
    tool_choice: 'auto',
    input: buildResearchPrompt(query),
    text: {
      format: {
        type: 'json_schema',
        name: 'stock_research_report',
        strict: true,
        schema: reportSchema
      },
      verbosity: 'medium'
    }
  };

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });

  const payloadText = await response.text();
  let payload = {};
  try {
    payload = JSON.parse(payloadText);
  } catch {
    payload = { raw: payloadText.slice(0, 1000) };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status >= 500 ? 502 : response.status,
      body: {
        ok: false,
        error: 'Stock research request failed.',
        upstreamStatus: response.status,
        detail: payload?.error?.message || payload?.raw || 'Unknown upstream error.'
      }
    };
  }

  const outputText = extractOutputText(payload);
  let reportData;
  try {
    reportData = JSON.parse(outputText);
  } catch {
    return {
      ok: false,
      status: 502,
      body: { ok: false, error: 'Stock research response was not valid JSON.' }
    };
  }

  return {
    ok: true,
    reportData,
    responseId: payload.id || null,
    model: payload.model || body.model
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (endOptions(req, res) || !requireMethod(req, res, 'POST')) return;

  let body;
  try {
    body = getJsonBody(req);
  } catch {
    return sendJson(res, 400, { ok: false, error: 'Malformed JSON.' });
  }

  const query = cleanQuery(body.query || body.stockName || body.name);
  if (!query) {
    return sendJson(res, 400, { ok: false, error: 'Stock name is required.' });
  }

  try {
    const result = await requestOpenAiResearch(query);
    if (!result.ok) return sendJson(res, result.status, result.body);
    return sendJson(res, 200, {
      ok: true,
      reportData: result.reportData,
      responseId: result.responseId,
      model: result.model,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    const timeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return sendJson(res, timeout ? 504 : 502, {
      ok: false,
      error: timeout ? 'Stock research timed out.' : 'Stock research failed.'
    });
  }
}
