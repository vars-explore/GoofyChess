import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeWithGemini } from '../server/review';

test('Gemini recap uses the stable model and supported generation options', async () => {
 const originalKey=process.env.GEMINI_API_KEY,originalFetch=globalThis.fetch;
 let requestUrl='',requestInit:RequestInit|undefined;
 process.env.GEMINI_API_KEY='test-key';
 globalThis.fetch=async (input,init)=>{
  requestUrl=String(input);requestInit=init;
  return new Response(JSON.stringify({candidates:[{content:{parts:[{text:'A dramatic game.'}]}}]}),{status:200});
 };
 try{
  const summary=await summarizeWithGemini(['e4'],[{kind:'cp',value:25},{kind:'cp',value:40}],'White wins');
  assert.equal(summary,'A dramatic game.');
  assert.equal(requestUrl,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
  assert.equal(new Headers(requestInit?.headers).get('x-goog-api-key'),'test-key');
  const body=JSON.parse(String(requestInit?.body));
  assert.deepEqual(body.generationConfig,{maxOutputTokens:1024,thinkingConfig:{thinkingLevel:'minimal'}});
 }finally{
  globalThis.fetch=originalFetch;
  if(originalKey===undefined)delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY=originalKey;
 }
});

test('Gemini recaps do not return responses truncated by the output token limit', async () => {
 const originalKey=process.env.GEMINI_API_KEY,originalFetch=globalThis.fetch;
 process.env.GEMINI_API_KEY='test-key';
 globalThis.fetch=async()=>new Response(JSON.stringify({
  candidates:[{content:{parts:[{text:'Black really thought they had plot armor,'}]},finishReason:'MAX_TOKENS'}],
 }),{status:200});
 try{
  await assert.rejects(
   summarizeWithGemini(['e4'],[{kind:'cp',value:25},{kind:'cp',value:40}],'White wins'),
   /Gemini recap reached the output token limit/,
  );
 }finally{
  globalThis.fetch=originalFetch;
  if(originalKey===undefined)delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY=originalKey;
 }
});

test('Gemini API errors include the provider response for server-side diagnosis', async () => {
 const originalKey=process.env.GEMINI_API_KEY,originalFetch=globalThis.fetch;
 process.env.GEMINI_API_KEY='test-key';
 globalThis.fetch=async()=>new Response('API key not valid',{status:400});
 try{
  await assert.rejects(
   summarizeWithGemini([],[],'Draw'),
   /Gemini returned HTTP 400: API key not valid/,
  );
 }finally{
  globalThis.fetch=originalFetch;
  if(originalKey===undefined)delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY=originalKey;
 }
});
