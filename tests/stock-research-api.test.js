import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import handler from '../api/stock-research/index.js';

const originalFetch = global.fetch;
const originalOpenAiKey = process.env.OPENAI_API_KEY;
const originalModel = process.env.STOCK_RESEARCH_MODEL;

function mockReq({ body = {}, method = 'POST' } = {}) {
  return { body, headers: {}, method };
}

function mockRes() {
  return {
    body: undefined,
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(value) {
      this.body = value;
      return this;
    },
    end(value = '') {
      this.body = value;
      return this;
    }
  };
}

async function callHandler(options) {
  const req = mockReq(options);
  const res = mockRes();
  await handler(req, res);
  return res;
}

function restoreEnv() {
  if (originalOpenAiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalOpenAiKey;
  }

  if (originalModel === undefined) {
    delete process.env.STOCK_RESEARCH_MODEL;
  } else {
    process.env.STOCK_RESEARCH_MODEL = originalModel;
  }
}

afterEach(() => {
  global.fetch = originalFetch;
  restoreEnv();
});

test('returns a clear error when OpenAI key is missing', async () => {
  delete process.env.OPENAI_API_KEY;

  const res = await callHandler({ body: { query: '拼多多' } });

  assert.equal(res.statusCode, 501);
  assert.equal(JSON.parse(res.body).error, 'OPENAI_API_KEY is not configured.');
});

test('posts stock research requests to OpenAI Responses API with web search', async () => {
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.STOCK_RESEARCH_MODEL = 'test-research-model';

  const reportData = {
    company: '拼多多',
    code: 'PDD',
    industry: '互联网电商',
    title: '拼多多（PDD）全景研究报告',
    subtitle: '实时 research',
    analysisDate: '2026-06-07',
    dataCutoff: '2026-06-07',
    sourceNote: '实时 research source note',
    snapshot: Array.from({ length: 8 }, (_, index) => [`指标${index}`, `数值${index}`, `备注${index}`]),
    businessSegments: Array.from({ length: 4 }, (_, index) => [`业务${index}`, `收入${index}`, `占比${index}`, `增速${index}`]),
    marginRows: Array.from({ length: 4 }, (_, index) => [`项目${index}`, `数值${index}`, `变化${index}`, `判断${index}`]),
    riskRows: Array.from({ length: 5 }, (_, index) => [`风险${index}`, `影响${index}`, `概率${index}`, `依据${index}`]),
    scenarios: Array.from({ length: 3 }, (_, index) => [`情景${index}`, `概率${index}`, `假设${index}`, `区间${index}`]),
    sections: Array.from({ length: 5 }, (_, index) => ({
      title: `章节${index}`,
      blocks: [{ heading: `标题${index}`, paragraphs: [`段落${index}`] }]
    })),
    keyFindings: Array.from({ length: 4 }, (_, index) => `发现${index}`),
    followUps: Array.from({ length: 5 }, (_, index) => `跟踪${index}`),
    infoGaps: Array.from({ length: 4 }, (_, index) => `缺口${index}`),
    sources: Array.from({ length: 3 }, (_, index) => ({
      title: `来源${index}`,
      publisher: `发布方${index}`,
      date: '2026-06-07',
      url: `https://example.com/${index}`,
      summary: `摘要${index}`
    }))
  };

  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer test-openai-key');
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'test-research-model');
    assert.deepEqual(body.tools, [{ type: 'web_search', external_web_access: true }]);
    assert.match(body.input, /拼多多/);
    assert.equal(body.text.format.type, 'json_schema');

    return new Response(JSON.stringify({
      id: 'resp_test',
      model: 'test-research-model',
      output_text: JSON.stringify(reportData)
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };

  const res = await callHandler({ body: { query: '拼多多' } });
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 200);
  assert.equal(body.ok, true);
  assert.equal(body.responseId, 'resp_test');
  assert.equal(body.reportData.title, '拼多多（PDD）全景研究报告');
  assert.equal(body.reportData.sources.length, 3);
});
