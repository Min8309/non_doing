import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/letters.mjs';
import worker from '../api/letter-worker.mjs';
import { sameOrigin, validWorker, cookies } from '../lib/letter-server.mjs';
const makeResponse=()=>({headers:{},setHeader(k,v){this.headers[k]=v},end(value){this.body=JSON.parse(value)}});
test('requests require same origin; worker requires an exact secret',()=>{
 assert.equal(sameOrigin({headers:{host:'room.example',origin:'https://evil.example'}}),false);
 assert.equal(sameOrigin({headers:{host:'room.example',origin:'https://room.example'}}),true);
 assert.equal(sameOrigin({headers:{host:'room.example'}}),false);
 process.env.CRON_SECRET='a'.repeat(40);
 assert.equal(validWorker({headers:{authorization:'Bearer '+process.env.CRON_SECRET}}),true);
 assert.equal(validWorker({headers:{authorization:'Bearer '+'é'.repeat(40)}}),false);
 assert.equal(validWorker({headers:{authorization:'Bearer wrong'}}),false);
 assert.equal(cookies({headers:{cookie:'bad=%xx; valid=hello'}}).valid,'hello');
});
test('unconfigured production cannot accept letters or anonymous sessions',async()=>{
 delete process.env.SUPABASE_URL;delete process.env.SUPABASE_ANON_KEY;delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 let response=makeResponse();await handler({method:'GET',url:'/api/letters?action=config',headers:{}},response);
 assert.deepEqual(response.body,{configured:false,ready:false});
 response=makeResponse();await handler({method:'POST',url:'/api/letters?action=session',headers:{host:'room.example',origin:'https://room.example'},body:{}},response);
 assert.equal(response.statusCode,503);assert.equal(response.body.error,'NOT_CONFIGURED');
 response=makeResponse();await worker({method:'GET',headers:{}},response);assert.equal(response.statusCode,401);
});
test('configured API authenticates ownership and does not expose access tokens',async()=>{
 process.env.SUPABASE_URL='https://test-project.supabase.co';process.env.SUPABASE_ANON_KEY='test-anon';process.env.SUPABASE_SERVICE_ROLE_KEY='test-service';process.env.LETTERS_ENABLED='true';process.env.LETTER_MODERATION_API_KEY='test-moderation';process.env.CRON_SECRET='a'.repeat(40);
 const originalFetch=global.fetch;const requests=[];
 global.fetch=async(url,options)=>{requests.push({url,options});return new Response(JSON.stringify(url.endsWith('/auth/v1/signup')?{access_token:'access-test',refresh_token:'refresh-test',expires_in:3600,user:{id:crypto.randomUUID()}}:{nicknameIndex:1,tickets:3,canSend:true}),{status:200})};
 try{
  const response=makeResponse();await handler({method:'POST',url:'/api/letters?action=session',headers:{host:'room.example',origin:'https://room.example'},body:{}},response);
  assert.equal(response.statusCode,200);assert.equal(response.body.tickets,3);
  assert.equal(JSON.stringify(response.body).includes('access-test'),false);
  assert.ok(response.headers['Set-Cookie'].every(cookie=>cookie.includes('HttpOnly')&&cookie.includes('Secure')&&cookie.includes('SameSite=Lax')));
  assert.equal(requests[1].options.headers.Authorization,'Bearer access-test');
  const blocked=makeResponse();await handler({method:'POST',url:'/api/letters?action=request',headers:{host:'room.example',origin:'https://evil.example'},body:{}},blocked);assert.equal(blocked.statusCode,403);
 }finally{global.fetch=originalFetch}
});
