#!/usr/bin/env node
/**
 * Copies the Pack Test Store access key from SSM SecureString /pack/e2e/test-store-key into the
 * CloudFront KeyValueStore `pack-test-store-key` (entry `test-store-key`), which the viewer-request
 * function reads at the edge. Rotating the key = new SSM value + this script; no code change.
 * The key is never printed or logged.
 *
 *   node scripts/test-store/sync-test-store-key.mjs
 */
import {execFileSync} from 'node:child_process';

const SSM_NAME = '/pack/e2e/test-store-key';
const KVS_NAME = 'pack-test-store-key';
const ENTRY = 'test-store-key';

const aws = (args, input) => execFileSync('aws', args, {encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'inherit']}).trim();

const kvs = JSON.parse(aws(['cloudfront', 'list-key-value-stores', '--output', 'json'])).KeyValueStoreList.Items.find((i) => i.Name === KVS_NAME);
if (kvs === undefined) {
  throw new Error(`KeyValueStore ${KVS_NAME} does not exist`);
}
const value = aws(['ssm', 'get-parameter', '--name', SSM_NAME, '--with-decryption', '--query', 'Parameter.Value', '--output', 'text']);
if (value.length < 32) {
  throw new Error('test-store key in SSM is shorter than 32 characters');
}
const etag = JSON.parse(aws(['cloudfront-keyvaluestore', 'describe-key-value-store', '--kvs-arn', kvs.ARN, '--output', 'json'])).ETag;
aws(['cloudfront-keyvaluestore', 'put-key', '--kvs-arn', kvs.ARN, '--key', ENTRY, '--value', value, '--if-match', etag, '--output', 'json']);
process.stdout.write(`synced ${ENTRY} into ${KVS_NAME} (value not shown)\n`);
